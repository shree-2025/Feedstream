import { ReactNode } from "react";

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

const CardContent = ({ children, className = "" }: CardContentProps) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};

export default CardContent;
