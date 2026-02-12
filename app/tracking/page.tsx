import { redirect } from 'next/navigation';

export default function TrackingPage() {
  // Redirect to the new tracking map system
  redirect('/tracking/map');
}
