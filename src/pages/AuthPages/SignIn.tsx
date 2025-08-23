import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <PageMeta
        title="Sign In | Elog-book"
        description="Sign in to your Elog-book account"
      />
      <SignInForm />
    </div>
  );
}
