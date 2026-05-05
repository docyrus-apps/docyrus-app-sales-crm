import { useRegisterDocyrusClient } from '@docyrus/devtools'
import { useDocyrusClient } from '@docyrus/signin'

export function DocyrusDevtoolsClientRegistration() {
  const client = useDocyrusClient()

  useRegisterDocyrusClient(client)

  return null
}
