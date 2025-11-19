import { NextResponse } from 'next/server';

export function middleware(request) {
  const usuarioCookie = request.cookies.get('usuario');
  const url = request.nextUrl.clone();
  const { pathname } = url;

  if (pathname.startsWith('/admin')) {
   
    if (!usuarioCookie) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    try {
      const usuario = JSON.parse(usuarioCookie.value);

      // Roles permitidos para acceder al dashboard admin
      const rolesPermitidos = ['admin', 'employee'];

      
      if (!rolesPermitidos.includes(usuario.rol)) {
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }

    } catch (error) {
     
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
