import { useContext } from 'react';
import { SessionContext } from '../lib/session-context';
export function useSession() { return useContext(SessionContext); }
