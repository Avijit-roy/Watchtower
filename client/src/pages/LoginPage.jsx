import { PublicLayout } from '../layouts/PublicLayout';
import { LoginForm } from '../features/auth/LoginForm';

export function LoginPage() {
  return (
    <PublicLayout>
      <LoginForm />
    </PublicLayout>
  );
}
