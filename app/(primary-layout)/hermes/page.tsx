import type { Metadata } from 'next';
import { HermesConsolePage } from '@/components/hermes/hermes-console-page';

export const metadata: Metadata = {
  title: 'Hermes Console — Shothik AI',
  description: 'Preview the Hermes runtime sessions, runs, and event stream.',
};

export default function HermesPage() {
  return <HermesConsolePage />;
}
