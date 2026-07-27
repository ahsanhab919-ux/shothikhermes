'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function HomeAuthRedirect() {
  const router = useRouter();
  const accessToken = useSelector((state: any) => state.auth?.accessToken);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
    if (accessToken) {
      router.replace('/writing-studio');
    }
  }, [accessToken, router]);

  if (!checked || accessToken) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-zinc-950 z-50">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}
