// import Image from "next/image";
import Hero from "./Pages/Hero";
// import Floatingnavbar from "@/app/components/layout/Floatingnavbar";
import Floatingnavbar from "./components/layout/Floatingnavbar";
import { Footer } from "./components/layout/Footer";
import CommunityPage from "./Pages/CommunityPage";
import TournamentSection from "./Pages/TournamentSection";
import ContactSection from "./Pages/ContactSection";
import SocialHub from "./Pages/SocialHub";
// import { Footer } from "@/app/components/layout/Footer";
// import Footer from "@Footer/components/layout/Footer";




export default function Home() {
  return (
    <main className="bg-black min-h-screen mx-4 my-2">
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
    </main>
  )
}
