import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
