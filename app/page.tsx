// import Image from "next/image";
import Hero from "./Pages/Hero";
// import Floatingnavbar from "@/app/components/layout/Floatingnavbar";
import Floatingnavbar from "./components/layout/Floatingnavbar";
import { Footer } from "./components/layout/Footer";
import CommunityPage from "./Pages/CommunityPage";
import TournamentSection from "./Pages/TournamentSection";
import ContactSection from "./Pages/ContactSection";
import SocialHub from "./Pages/SocialHub";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { Footer } from "@/app/components/layout/Footer";
// import Footer from "@Footer/components/layout/Footer";




export default function Home() {
  return (
    <main className="bg-black min-h-screen mx-1 my-2 overflow-hidden">
      <div className="">
        <Floatingnavbar/>
        <Hero />
        <div className="">
          <CommunityPage />
        </div>
        <div className="py-10">
          <TournamentSection />
        </div>
        {/* <div className="py-20">
          <VideoSection />
        </div> */}
        <div className="">
          <SocialHub/>
        </div>
        <div className="">
          <ContactSection />
        </div>
        <div className="pb-2">
          <Footer />
        </div>
      </div>
       <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark" // Since your app has a dark theme
      />
    </main>
  )
}
