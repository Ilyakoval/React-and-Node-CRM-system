import { Modal, Form, Input, message } from 'antd';
import { projectsApi } from '../api/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddProjectModal({ open, onClose, onAdded }: Props) {
  const [form] = Form.useForm<{ repoPath: string }>();
  const [messageApi, contextHolder] = message.useMessage();

  async function handleOk() {
    const values = await form.validateFields();
    const repoPath = values.repoPath.trim();

    try {
      await projectsApi.add(repoPath);
      messageApi.success('Repository is being fetched in the background…');
      form.resetFields();
      onAdded();
    } catch {
      messageApi.error('Failed to add repository. Check the path and try again.');
    }
  }

  return (
    <Modal
      title="Add GitHub Repository"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      afterClose={() => form.resetFields()}
      okText="Add"
    >
      {contextHolder}
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="repoPath"
          label="Repository path"
          extra="Example: facebook/react"
          rules={[
            { required: true, message: 'Please enter the repository path' },
            {
              pattern: /^[\w.-]+\/[\w.-]+$/,
              message: 'Format must be owner/repo (e.g. facebook/react)',
            },
          ]}
        >
          <Input placeholder="owner/repo" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
