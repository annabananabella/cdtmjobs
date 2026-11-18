import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import JobSubmissionForm from "@/components/JobSubmissionForm";
import FloatingParticles from "@/components/FloatingParticles";

const PostJob = () => {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <FloatingParticles />
      <Header />

      <main className="container max-w-xl mx-auto px-6 py-12 relative z-10">
        <JobSubmissionForm />
      </main>

      <div className="flex-1" />
      <Footer />
    </div>
  );
};

export default PostJob;
