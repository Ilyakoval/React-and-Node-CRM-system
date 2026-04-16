import { Form, Input, Button, Card, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';

const { Title } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  async function onFinish({ email, password }: { email: string; password: string }) {
    try {
      await authApi.register(email, password);
      messageApi.success('Account created! Please sign in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch {
      messageApi.error('Registration failed. The email may already be taken.');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      {contextHolder}
      <Card style={{ width: 360 }}>
        <Title level={3} style={{ textAlign: 'center' }}>
          Register
        </Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Password is required' },
              { min: 6, message: 'Minimum 6 characters' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
