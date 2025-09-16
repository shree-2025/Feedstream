import { useState } from "react";
import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  
  return (
    <div className="w-full max-w-xs">
      <div className="mb-3 text-center">
        <h1 className=" font-semibold text-gray-800 dark:text-white" style={{ fontSize: '35px' }}>
          Sign Up
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontSize: '20px' }}>
          Create your account
        </p>
      </div>
            <form className="space-y-3">
              <div className="space-y-3">
                <div>
                  <Label>
                    Company Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="company"
                    name="company"
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                  />
                </div>
                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                  />
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Confirm Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      className="py-1.5"
                      placeholder="Enter your confirm password"
                      type={showPassword ? "text" : "password"}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-2 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {/* <!-- Checkbox --> */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    className="w-4 h-4 mt-0.5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                         You agree to our{" "}
                    <span className="text-gray-800 dark:text-white/90">Terms</span> and{" "}
                    <span className="text-gray-800 dark:text-white/90">Privacy Policy</span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <button className="flex items-center justify-center w-full px-3 py-1.5 text-sm font-medium text-white transition rounded-md bg-brand-500 hover:bg-brand-600">
                    Sign Up
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-4">
              <p className="text-xs font-normal text-center text-gray-700 dark:text-gray-400">
                Already have an account? {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
      </div>
    </div>
  );
}
