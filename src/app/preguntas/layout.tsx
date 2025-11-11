import Navbar from '../../../components/NavbarStatic';

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}