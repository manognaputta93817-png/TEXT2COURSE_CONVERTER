'use client';

import { useRouter } from 'next/navigation';

export default function LoginButton() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/signin');
  };

  return (
    <button onClick={handleLogin}>
      Login
    </button>
  );
}
