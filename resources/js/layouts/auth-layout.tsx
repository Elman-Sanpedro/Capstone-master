import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({ children, title, description, backButton, ...props }: { children: React.ReactNode; title: string; description: string; backButton?: React.ReactNode }) {
    return (
        <AuthLayoutTemplate title={title} description={description} backButton={backButton} {...props}>
            {children}
        </AuthLayoutTemplate>
    );
}
