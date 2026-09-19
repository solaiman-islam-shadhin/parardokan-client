import { useTheme } from "../../context/ThemeContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/auth", { replace: true });
  }, []);
  return null;
}
