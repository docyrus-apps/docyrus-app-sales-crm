import { useEffect, useState } from 'react'
import { Agentation } from 'agentation'
import {
  SignInButton,
  useDocyrusAuth,
  useDocyrusClient,
} from '@docyrus/app-auth-ui'
import { Button } from './components/ui/button'
import { UsersCollection } from './collections/users.collection'
import { setApiClient } from './lib/api'

interface UserProfile {
  id?: string
  email?: string
  firstname?: string
  lastname?: string
}

function App() {
  const { status, signOut } = useDocyrusAuth()
  const client = useDocyrusClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Sync the library's API client to the module-level apiClient used by collections
  useEffect(() => {
    if (client) {
      setApiClient(client)
    }
  }, [client])

  useEffect(() => {
    if (status === 'authenticated') {
      setProfileLoading(true)
      UsersCollection.getMyInfo()
        .then((data) => {
          setUserProfile(data)
        })
        .catch((error) => {
          console.error('Failed to fetch user profile:', error)
        })
        .finally(() => {
          setProfileLoading(false)
        })
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-md">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Sign in to access your account
                </p>
              </div>
              <div className="grid gap-6">
                <SignInButton>
                  {({ signIn, status: btnStatus }) => (
                    <Button
                      onClick={signIn}
                      className="w-full"
                      disabled={btnStatus === 'loading'}
                      size="lg"
                    >
                      {btnStatus === 'loading'
                        ? 'Redirecting...'
                        : 'Sign in with Docyrus'}
                    </Button>
                  )}
                </SignInButton>
              </div>
            </div>
          </div>
        </div>
        {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              You're signed in
            </h2>
            {profileLoading ? (
              <p className="text-gray-500 mt-2 animate-pulse">
                Loading profile...
              </p>
            ) : userProfile ? (
              <div className="text-gray-800 mt-2">
                {userProfile.email && <p>{userProfile.email}</p>}
                {(userProfile.firstname || userProfile.lastname) && (
                  <p>
                    {userProfile.firstname} {userProfile.lastname}
                  </p>
                )}
              </div>
            ) : null}
            <Button onClick={signOut} variant="outline" className="mt-4">
              Sign Out
            </Button>
          </div>
        </main>
      </div>
      {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
    </>
  )
}

export default App
