import {defineNextjsHandler} from '@genkit-ai/next';
import '@/ai/dev'; // Make sure we import the dev file to register the flows

export const GET = defineNextjsHandler();
export const POST = defineNextjsHandler();
