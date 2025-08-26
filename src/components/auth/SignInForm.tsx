import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function SignInForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/department-admin/dashboard');
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xs">
      <div className="mb-4 text-center">
        <img
          src={theme === 'dark' ? '/images/logo/logo-dark.svg' : '/images/logo/logo.svg'}
          alt="Feedstream Logo"
          className="mx-auto h-12 w-auto"
        />
      </div>
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

          {/* Demo credentials removed */}
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
