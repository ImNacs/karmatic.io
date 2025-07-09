import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getOrCreateUser } from '@/lib/auth/helpers';

export default async function ProfilePage() {
  const { userId } = await auth();
  
  // This route is protected by middleware, but adding extra check
  if (!userId) {
    redirect('/sign-in');
  }
  
  const user = await getOrCreateUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
      
      <div className="bg-card rounded-lg p-6 shadow-lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Nombre</label>
            <p className="text-lg font-medium">{user.firstName} {user.lastName}</p>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="text-lg">{user.email}</p>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">ID de Usuario</label>
            <p className="text-sm font-mono text-muted-foreground">{user.clerkUserId}</p>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Fecha de Registro</label>
            <p className="text-lg">{new Date(user.createdAt).toLocaleDateString('es-MX')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}