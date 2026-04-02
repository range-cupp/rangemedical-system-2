// Short URL redirect: /q/[token] → /questionnaire/[token]
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ShortQuestionnaireRedirect() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      router.replace(`/questionnaire/${token}`);
    }
  }, [token, router]);

  return null;
}
