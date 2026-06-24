import { useCallback, useEffect, useReducer, useRef } from 'react'

import { useTranslation } from 'react-i18next'
import { Camera, Loader2, Save } from 'lucide-react'

import { toast } from 'sonner'

import { useUsersCollection } from '@/collections/users.collection'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogFooter,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog'
import { ImageEditor } from '@/components/docyrus/image-editor'

interface UserWithPhoto {
  id?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  mobile?: string;
  job_title?: string;
  photo?: string;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileFormData {
  firstname: string;
  lastname: string;
  mobile: string;
  job_title: string;
}

interface FormErrors {
  firstname?: string;
  lastname?: string;
}

const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif'
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB (backend limit)

interface ProfileState {
  user: UserWithPhoto | null;
  loading: boolean;
  saving: boolean;
  form: ProfileFormData;
  errors: FormErrors;
  photoUrl: string | null;
  editorSrc: string | null;
  editorOpen: boolean;
  uploadingPhoto: boolean;
}

type ProfileAction =
  | { type: 'LOAD_START' }
  | {
      type: 'LOAD_SUCCESS';
      user: UserWithPhoto;
    }
    | { type: 'LOAD_ERROR' }
    | { type: 'SET_FORM_FIELD'; field: keyof ProfileFormData; value: string }
    | { type: 'SET_ERRORS'; errors: FormErrors }
    | { type: 'SAVE_START' }
    | { type: 'SAVE_SUCCESS'; user: UserWithPhoto }
    | { type: 'SAVE_END' }
    | { type: 'SET_EDITOR_SRC'; src: string | null }
    | { type: 'SET_EDITOR_OPEN'; open: boolean }
    | { type: 'UPLOAD_START' }
    | {
      type: 'UPLOAD_SUCCESS';
      photoUrl: string | undefined;
      user: UserWithPhoto | null;
    }
    | { type: 'UPLOAD_END'; editorSrc: string | null }

const initialState: ProfileState = {
  user: null,
  loading: true,
  saving: false,
  form: {
    firstname: '',
    lastname: '',
    mobile: '',
    job_title: ''
  },
  errors: {},
  photoUrl: null,
  editorSrc: null,
  editorOpen: false,
  uploadingPhoto: false
}

function profileReducer(
  state: ProfileState,
  action: ProfileAction
): ProfileState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true }

    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.user,
        photoUrl: action.user.photo ?? null,
        form: {
          firstname: action.user.firstname ?? '',
          lastname: action.user.lastname ?? '',
          mobile: action.user.mobile ?? '',
          job_title: action.user.job_title ?? ''
        }
      }

    case 'LOAD_ERROR':
      return { ...state, loading: false }

    case 'SET_FORM_FIELD':
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined }
      }

    case 'SET_ERRORS':
      return { ...state, errors: action.errors }

    case 'SAVE_START':
      return { ...state, saving: true }

    case 'SAVE_SUCCESS':
      return { ...state, saving: false, user: action.user }

    case 'SAVE_END':
      return { ...state, saving: false }

    case 'SET_EDITOR_SRC':
      return { ...state, editorSrc: action.src }

    case 'SET_EDITOR_OPEN':
      return { ...state, editorOpen: action.open }

    case 'UPLOAD_START':
      return { ...state, uploadingPhoto: true }

    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        photoUrl: action.photoUrl ?? state.photoUrl,
        user: action.user,
        editorOpen: false
      }

    case 'UPLOAD_END':
      return {
        ...state,
        uploadingPhoto: false,
        editorSrc: action.editorSrc
      }
  }
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { t } = useTranslation()
  const { getMyInfo, updateMe } = useUsersCollection()
  const [state, dispatch] = useReducer(profileReducer, initialState)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    dispatch({ type: 'LOAD_START' })
    getMyInfo()
      .then((data) => {
        dispatch({ type: 'LOAD_SUCCESS', user: data as UserWithPhoto })
      })
      .catch(() => {
        toast.error(t('profile.profileUpdateFailed'))
        dispatch({ type: 'LOAD_ERROR' })
      })
  }, [open])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (state.editorSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(state.editorSrc)
      }
    }
  }, [state.editorSrc])

  const handleChange = useCallback(
    (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: 'SET_FORM_FIELD', field, value: e.target.value })
      },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const validationErrors: FormErrors = {}

      if (!state.form.firstname.trim()) {
        validationErrors.firstname = t('profile.firstNameRequired')
      }
      if (!state.form.lastname.trim()) {
        validationErrors.lastname = t('profile.lastNameRequired')
      }
      if (Object.keys(validationErrors).length > 0) {
        dispatch({ type: 'SET_ERRORS', errors: validationErrors })

        return
      }

      dispatch({ type: 'SAVE_START' })
      try {
        const updated = await updateMe({
          firstname: state.form.firstname.trim(),
          lastname: state.form.lastname.trim(),
          mobile: state.form.mobile.trim(),
          job_title: state.form.job_title.trim()
        })

        dispatch({ type: 'SAVE_SUCCESS', user: updated as UserWithPhoto })
        toast.success(t('profile.profileUpdated'))
        onOpenChange(false)
      } catch {
        toast.error(t('profile.profileUpdateFailed'))
        dispatch({ type: 'SAVE_END' })
      }
    },
    [
state.form,
onOpenChange,
updateMe,
t
]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]

      e.target.value = ''

      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast.error(t('profile.selectImage'))

        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('profile.imageTooLarge'))

        return
      }

      const objectUrl = URL.createObjectURL(file)

      dispatch({ type: 'SET_EDITOR_SRC', src: objectUrl })
      dispatch({ type: 'SET_EDITOR_OPEN', open: true })
    },
    [t]
  )

  const handleImageSave = useCallback(
    async (dataUrl: string) => {
      if (!apiClient) return
      dispatch({ type: 'UPLOAD_START' })
      try {
        // Convert data URL to File
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], 'avatar.png', { type: 'image/png' })

        const formData = new FormData()

        formData.append('photo', file)

        const result = await apiClient.put<{ fileUrl: string }>(
          '/v1/users/me/photo',
          formData
        )

        const newPhotoUrl = result?.fileUrl

        dispatch({
          type: 'UPLOAD_SUCCESS',
          photoUrl: newPhotoUrl,
          user: state.user
            ? { ...state.user, photo: newPhotoUrl ?? state.user.photo }
            : null
        })
        toast.success(t('profile.photoUpdated'))
      } catch {
        toast.error(t('profile.photoUploadFailed'))
        dispatch({ type: 'SET_EDITOR_OPEN', open: false })
      } finally {
        if (state.editorSrc?.startsWith('blob:')) {
          URL.revokeObjectURL(state.editorSrc)
        }
        dispatch({ type: 'UPLOAD_END', editorSrc: null })
      }
    },
    [state.editorSrc, state.user, t]
  )

  const initials = state.user
    ? `${(state.user.firstname?.[0] ?? '').toUpperCase()}${(state.user.lastname?.[0] ?? '').toUpperCase()}`
    : '?'

  const displayName = state.user
    ? [state.user.firstname, state.user.lastname].filter(Boolean).join(' ') ||
    state.user.email
    : ''

  return (
    <>
      <AwesomeDialog
        open={open}
        onOpenChange={onOpenChange}
        container="sheet"
        side="right"
        size="default">
        <AwesomeDialogHeader title={t('profile.title')} />
        <AwesomeDialogBody>
          <div className="flex items-center gap-3 pb-4">
            <button
              type="button"
              className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => fileInputRef.current?.click()}
              disabled={state.uploadingPhoto}
              aria-label={t('profile.changePhoto')}>
              <Avatar className="size-14">
                {state.photoUrl && (
                  <AvatarImage src={state.photoUrl} alt={displayName ?? ''} />
                )}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {state.uploadingPhoto ? (
                  <Loader2 className="size-5 animate-spin text-white" />
                ) : (
                  <Camera className="size-5 text-white" />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="hidden"
              onChange={handleFileSelect} />
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">
                {state.user?.email ?? t('profile.description')}
              </p>
            </div>
          </div>

          <Separator />

          {state.loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : (
            <form id="profile-form" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>{t('profile.firstName')}</FieldLabel>
                    <Input
                      value={state.form.firstname}
                      onChange={handleChange('firstname')}
                      placeholder={t('profile.firstName')}
                      aria-invalid={!!state.errors.firstname} />
                    {state.errors.firstname && (
                      <FieldError>{state.errors.firstname}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel>{t('profile.lastName')}</FieldLabel>
                    <Input
                      value={state.form.lastname}
                      onChange={handleChange('lastname')}
                      placeholder={t('profile.lastName')}
                      aria-invalid={!!state.errors.lastname} />
                    {state.errors.lastname && (
                      <FieldError>{state.errors.lastname}</FieldError>
                    )}
                  </Field>
                </div>

                <Field>
                  <FieldLabel>{t('profile.email')}</FieldLabel>
                  <Input value={state.user?.email ?? ''} disabled />
                </Field>

                <Field>
                  <FieldLabel>{t('profile.phone')}</FieldLabel>
                  <Input
                    value={state.form.mobile}
                    onChange={handleChange('mobile')}
                    placeholder={t('profile.phone')}
                    type="tel" />
                </Field>

                <Field>
                  <FieldLabel>{t('profile.jobTitle')}</FieldLabel>
                  <Input
                    value={state.form.job_title}
                    onChange={handleChange('job_title')}
                    placeholder={t('profile.jobTitle')} />
                </Field>
              </FieldGroup>
            </form>
          )}
        </AwesomeDialogBody>
        <AwesomeDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="profile-form" disabled={state.saving}>
            {state.saving ? <Loader2 className="animate-spin" /> : <Save />}
            {t('profile.saveChanges')}
          </Button>
        </AwesomeDialogFooter>
      </AwesomeDialog>

      {/* Image editor dialog */}
      <AwesomeDialog
        open={state.editorOpen}
        onOpenChange={v => dispatch({ type: 'SET_EDITOR_OPEN', open: v })}
        container="modal"
        size="lg">
        <AwesomeDialogHeader
          title={t('profile.cropPhoto')}
          description={t('profile.cropPhotoDescription')} />
        <AwesomeDialogBody>
          {state.editorSrc && (
            <ImageEditor
              src={state.editorSrc}
              stencilShape="circle"
              aspectRatio={1}
              onSave={handleImageSave} />
          )}
        </AwesomeDialogBody>
      </AwesomeDialog>
    </>
  )
}
