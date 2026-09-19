import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Navbar from "../public/Navbar";
import Footer from "../public/Footer";
import SmoothScroll from "../ui/SmoothScroll";
import PageTransition from "../ui/PageTransition";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";

export default function HomeLayout() {
  const location = useLocation();
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingSpinner fullScreen label="Preparing your neighborhood..." />;
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-base-100">
        <Navbar />
        <main className="flex-1">
          <PageTransition pageKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
