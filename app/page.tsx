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
    <main className="bg-black min-h-screen mx-1  overflow-x-hidden">
      <div className="mt-2">
        <Floatingnavbar/>
        <section id="home">
        <Hero />
        </section>
        <section id="community" className="">
          <CommunityPage />
        </section>
        <section id="tournaments" className="py-10">
          <TournamentSection />
        </section>
        {/* <div className="py-20">
          <VideoSection />
        </div> */}
        <section id="social" className="">
          <SocialHub/>
        </section>
        <section id="contact" className="">
          <ContactSection />
        </section>
        <div className="">
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
