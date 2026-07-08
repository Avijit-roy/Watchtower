import { PublicLayout } from '../layouts/PublicLayout';
import { RegisterForm } from '../features/auth/RegisterForm';

export function RegisterPage() {
  return (
    <PublicLayout>
      <RegisterForm />
    </PublicLayout>
  );
}
