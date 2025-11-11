import Navbar from '../../../components/NavbarStatic';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
