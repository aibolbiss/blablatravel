import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Технические/непереводимые разделы — живут вне [locale] и не должны
// участвовать в редиректах next-intl на префикс языка.
const NON_LOCALE_PREFIXES = ['/auth/callback', '/admin'];

function isNonLocalePath(pathname: string): boolean {
  return NON_LOCALE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function splitLocale(pathname: string): { locale: string; path: string } {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return { locale, path: pathname.slice(locale.length + 1) || '/' };
    }
  }
  return { locale: routing.defaultLocale, path: pathname };
}

function createSupabaseMiddlewareClient(request: NextRequest, requestHeaders: Headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  return { supabase, getResponse: () => response };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // /auth/callback и /admin не локализованы — не пропускаем их через
  // next-intl вообще, иначе он редиректит их на несуществующий /ru/admin.
  if (isNonLocalePath(pathname)) {
    const requestHeaders = new Headers(request.headers);
    const { supabase, getResponse } = createSupabaseMiddlewareClient(request, requestHeaders);
    const { data: { user } } = await supabase.auth.getUser();

    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    requestHeaders.set('x-user-id', user?.id ?? '');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // С localePrefix: 'always' next-intl либо редиректит на префикс локали
  // (для непрефиксованных путей вроде "/"), либо просто пропускает запрос —
  // фактический роутинг "/ru/map" делает сама файловая система Next.js
  // через сегмент [locale], без rewrite. Поэтому для редиректа отдаём его
  // сразу, а для остальных случаев строим финальный ответ сами.
  const intlResponse = intlMiddleware(request);
  const isRedirect = intlResponse.headers.has('location');
  if (isRedirect) return intlResponse;

  const requestHeaders = new Headers(request.headers);
  const { supabase, getResponse } = createSupabaseMiddlewareClient(request, requestHeaders);

  const { data: { user } } = await supabase.auth.getUser();

  const { locale, path } = splitLocale(pathname);
  const protectedPaths = ['/cabinet', '/favorites', '/chat'];
  if (!user && protectedPaths.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    return NextResponse.redirect(url);
  }

  // Передаём id пользователя дальше в рендер, чтобы страницы не делали повторный auth.getUser()
  requestHeaders.set('x-user-id', user?.id ?? '');
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Сохраняем cookie локали, выставленную next-intl (NEXT_LOCALE), и
  // куки сессии, которые supabase мог обновить выше.
  intlResponse.cookies.getAll().forEach((c) => response.cookies.set(c));
  getResponse().cookies.getAll().forEach((c) => response.cookies.set(c));

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
