import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 py-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
