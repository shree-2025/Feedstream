import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Select from "../form/Select";
import { useAuth, UserRole } from "../../context/AuthContext";

export default function SignInForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [role, setRole] = useState<UserRole | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    { value: "OrganizationAdmin", label: "Organization Admin" },
    { value: "DepartmentAdmin", label: "Department Admin" },
    { value: "Staff", label: "Staff" },
    { value: "Student", label: "Student" },
  ];

  const handleRoleChange = (value: string) => {
    setRole(value as UserRole);
    setError(""); // Clear any previous errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await login(email, password, role);
      if (success) {
        // Navigate to appropriate dashboard based on role
        const dashboardRoutes: Record<UserRole, string> = {
          MasterAdmin: "/master-admin/dashboard",
          OrganizationAdmin: "/organization-admin/dashboard",
          DepartmentAdmin: "/department-admin/dashboard",
          Staff: "/staff/dashboard",
          Student: "/student/dashboard",
        };
        navigate(dashboardRoutes[role]);
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xs">
      <div className="mb-3 text-center">
        <h1 className="font-semibold text-gray-800 dark:text-white" style={{ fontSize: '35px' }}>
          Sign In
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontSize: '20px' }}>
          Welcome back
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <Label>
              Role <span className="text-error-500">*</span>
            </Label>
            <Select
              options={roleOptions}
              placeholder="Select a role"
              onChange={handleRoleChange}
              value={role || ''}
              className="dark:bg-gray-900"
            />
          </div>

          <div>
            <Label>
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              placeholder="info@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // remove `required` if not supported in InputProps
            />
          </div>

          <div>
            <Label>
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // remove `required` if not supported in InputProps
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showPassword ? (
                  <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                )}
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <Checkbox
                className="w-4 h-4 mt-0.5"
                checked={isChecked}
                onChange={setIsChecked}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Keep me signed in
              </p>
            </div>
            <Link
              to="/reset-password"
              className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full px-3 py-1.5 text-sm font-medium text-white transition rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Authentication now uses the backend API. Use valid credentials for the selected role.
            </p>
          </div>
        </div>
      </form>

      <div className="mt-5">
        <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
