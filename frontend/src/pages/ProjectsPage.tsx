import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Button,
  Table,
  Space,
  Typography,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  LogoutOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsApi, type Project } from '../api/api';
import AddProjectModal from '../components/AddProjectModal';

const { Title } = Typography;

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 6;

export default function ProjectsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectsApi.list();
      setProjects(data);
      return data;
    } catch {
      messageApi.error('Failed to load projects');
      return null;
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchProjects();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [fetchProjects]);

  function startPolling(expectedMinCount: number, attempt = 0) {
    if (attempt >= POLL_MAX_ATTEMPTS) return;

    pollTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await projectsApi.list();
        setProjects(data);
        if (data.length <= expectedMinCount) {
          startPolling(expectedMinCount, attempt + 1);
        }
      } catch { /* silent – main error handling is in fetchProjects */ }
    }, POLL_INTERVAL_MS);
  }

  async function handleRefresh(id: string) {
    setRefreshingId(id);
    try {
      const { data } = await projectsApi.refresh(id);
      setProjects((prev) => prev.map((p) => (p._id === id ? data : p)));
      messageApi.success('Project updated');
    } catch {
      messageApi.error('Failed to update project');
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      await projectsApi.delete(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      messageApi.success('Project deleted');
    } catch {
      messageApi.error('Failed to delete project');
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const columns: ColumnsType<Project> = [
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      sorter: (a, b) => a.owner.localeCompare(b.owner),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: 'Stars',
      dataIndex: 'stars',
      key: 'stars',
      sorter: (a, b) => a.stars - b.stars,
      render: (v: number) => <Tag color="gold">★ {v.toLocaleString()}</Tag>,
    },
    {
      title: 'Forks',
      dataIndex: 'forks',
      key: 'forks',
      sorter: (a, b) => a.forks - b.forks,
      render: (v: number) => <Tag color="blue">⑂ {v.toLocaleString()}</Tag>,
    },
    {
      title: 'Open Issues',
      dataIndex: 'openIssues',
      key: 'openIssues',
      sorter: (a, b) => a.openIssues - b.openIssues,
      render: (v: number) => <Tag color="red">{v.toLocaleString()}</Tag>,
    },
    {
      title: 'Created (Unix UTC)',
      dataIndex: 'createdAtUnix',
      key: 'createdAtUnix',
      sorter: (a, b) => a.createdAtUnix - b.createdAtUnix,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={refreshingId === record._id}
            onClick={() => handleRefresh(record._id)}
          >
            Update
          </Button>
          <Popconfirm
            title="Delete this project?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            okType="danger"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          GitHub Projects
        </Title>

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Add Repository
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchProjects}>
            Refresh List
          </Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={projects}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 'max-content' }}
      />

      <AddProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={() => {
          setModalOpen(false);
          startPolling(projects.length);
        }}
      />
    </div>
  );
}
