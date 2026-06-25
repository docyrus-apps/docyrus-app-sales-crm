import { useMemo, useState } from 'react'

import { Loader2, Plus, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogFooter,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { Combobox } from '@/components/ui/combobox-simple'
import { Field } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { useContacts, useUpdateContact } from '@/hooks/use-contacts'

interface ContactAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: unknown;
  organizationId?: string | null;
  existingContactIds?: Array<string | null | undefined>;
  onSuccess?: () => void | Promise<void>;
}

interface ContactOptionRecord {
  id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  job_title?: string;
  organization?: { id?: string; name?: string } | string | null;
}

function getRelationId(value: unknown): string {
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id?: string | null }).id ?? '')
  }

  return typeof value === 'string' ? value : ''
}

function getContactLabel(contact: ContactOptionRecord): string {
  const primary =
    contact.name || contact.email || contact.mobile || contact.id || ''
  const organizationName =
    contact.organization && typeof contact.organization === 'object'
      ? contact.organization.name
      : undefined
  const detail = [contact.job_title, organizationName, contact.email]
    .filter(Boolean)
    .join(' - ')

  return detail ? `${primary} (${detail})` : primary
}

export function ContactAddDialog({
  open,
  onOpenChange,
  organization,
  organizationId,
  existingContactIds = [],
  onSuccess
}: ContactAddDialogProps) {
  const { t } = useTranslation()
  const [selectedContactId, setSelectedContactId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const updateContact = useUpdateContact()
  const targetOrganizationId = organizationId ?? getRelationId(organization)
  const { data: contacts = [] } = useContacts({
    columns: [
      'id',
      'name',
      'job_title',
      'email',
      'mobile',
      'organization(id,name)'
    ],
    orderBy: 'name ASC',
    limit: 300
  })
  const existingIds = useMemo(
    () => new Set(existingContactIds.filter(Boolean).map(String)),
    [existingContactIds]
  )
  const contactOptions = useMemo(
    () => (contacts as Array<ContactOptionRecord>)
        .filter(contact => contact.id && !existingIds.has(contact.id))
        .map(contact => ({
          label: getContactLabel(contact),
          value: String(contact.id)
        })),
    [contacts, existingIds]
  )
  const isLinking = updateContact.isPending

  const handleLink = async () => {
    if (!targetOrganizationId) {
      setError(
        t('relatedTables.contacts.missingOrganization', {
          defaultValue: 'Select a company before adding contacts.'
        })
      )

      return
    }

    if (!selectedContactId) {
      setError(
        t('relatedTables.contacts.selectExisting', {
          defaultValue: 'Select a contact first.'
        })
      )

      return
    }

    setError(null)

    try {
      await updateContact.mutateAsync({
        contactId: selectedContactId,
        data: { organization: targetOrganizationId }
      })
      setSelectedContactId('')
      await onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('relatedTables.contacts.linkError', {
              defaultValue: 'Contact could not be linked.'
            })
      )
    }
  }

  const openCreateForm = () => {
    setSelectedContactId('')
    setError(null)
    onOpenChange(false)
    setCreateOpen(true)
  }

  return (
    <>
      <AwesomeDialog
        open={open && !createOpen}
        onOpenChange={onOpenChange}
        container="modal"
        size="default">
        <AwesomeDialogHeader
          title={t('relatedTables.contacts.addExistingTitle', {
            defaultValue: 'Add contact'
          })}
          description={t('relatedTables.contacts.addExistingDescription', {
            defaultValue: 'Choose an existing contact or create a new one.'
          })} />

        <AwesomeDialogBody className="space-y-4">
          <Field>
            <Label>
              {t('relatedTables.contacts.existingContact', {
                defaultValue: 'Existing contact'
              })}
            </Label>
            <Combobox
              options={contactOptions}
              value={selectedContactId}
              onValueChange={setSelectedContactId}
              disabled={!targetOrganizationId || isLinking}
              placeholder={t('relatedTables.contacts.selectContact', {
                defaultValue: 'Search contacts...'
              })}
              searchPlaceholder={t('relatedTables.contacts.search', {
                defaultValue: 'Search contacts...'
              })}
              emptyText={t('relatedTables.contacts.noAvailableContacts', {
                defaultValue: 'No available contacts found'
              })} />
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </AwesomeDialogBody>

        <AwesomeDialogFooter>
          <Button
            type="button"
            variant="outline"
            className="mr-auto"
            onClick={openCreateForm}
            disabled={!targetOrganizationId || isLinking}>
            <Plus className="mr-2 size-4" />
            {t('contacts.new', { defaultValue: 'New Contact' })}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLinking}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleLink}
            disabled={!selectedContactId || !targetOrganizationId || isLinking}>
            {isLinking ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 size-4" />
            )}
            {t('relatedTables.contacts.linkExisting', {
              defaultValue: 'Link contact'
            })}
          </Button>
        </AwesomeDialogFooter>
      </AwesomeDialog>

      <ContactFormDialog
        open={createOpen}
        onOpenChange={(nextOpen) => {
          setCreateOpen(nextOpen)
        }}
        contact={{ organization: organization ?? targetOrganizationId }}
        mode="create"
        onSubmitSuccess={onSuccess} />
    </>
  )
}
