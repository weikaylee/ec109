import {sessionConfigurationReady} from '../../../lib/config';
import {database} from '../../../lib/supabase';
import {identity,noStore} from '../../../lib/access';
import {participantKey} from '../../../lib/participant';
export const dynamic='force-dynamic';
/** Initialize an anonymous survey session, or check admin access explicitly. */
export async function GET(req: Request){
  try {
    if(new URL(req.url).searchParams.get('admin') === '1') {
      const who = await identity();
      return Response.json({authenticated:!!who,admin:!!who?.admin},{headers:noStore});
    }
    if(!sessionConfigurationReady())return Response.json({error:'Survey storage is not configured. The site owner must set the Supabase URL and service-role key, then restart or redeploy the app.'},{status:503,headers:noStore});
    const key = await participantKey(true);
    const {data,error}=await database().rpc('register_participant',{p_key:key});
    if(error)throw error;
    return Response.json({authenticated:true,admin:false,id:data.response_id,submitted:!!data.submitted_at},{headers:noStore});
  } catch {
    return Response.json({error:'Could not load your survey. Check the database setup and try again.'},{status:503,headers:noStore});
  }
}
