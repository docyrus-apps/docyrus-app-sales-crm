# Wrap-up and Notes Persistence Example

Bu dosya wrap-up submit, call activity persistence ve pinned note create akışını örnekler.

## Wrap-up submit örneği

```ts
type WrapupSubmitInput = {
  disposition: string
  notes?: string
  scheduleCallback?: boolean
  callbackDueDate?: string
  callbackDueTime?: string
  callbackPriority?: string
  callbackInstructions?: string
  contactId?: string
  leadId?: string
}

const WRAPUP_TO_ACTIVITY_DISPOSITION: Record<string, string> = {
  completed: 'Reached - Success',
  interested: 'Reached - Success',
  callback_requested: 'Callback Scheduled',
  not_interested: 'Reached - No Interest',
  wrong_number: 'Wrong Number',
  no_answer: 'No Answer',
  voicemail: 'Voicemail',
}

const WRAPUP_TO_OUTCOME: Record<string, string> = {
  completed: 'Answered',
  interested: 'Answered',
  callback_requested: 'Answered',
  not_interested: 'Answered',
  wrong_number: 'Wrong Number',
  no_answer: 'No Answer',
  voicemail: 'Voicemail',
}

function normalizeWrapupToken(value: string | undefined): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_') ?? ''
  )
}

function wrapupDispositionLabel(value: string | undefined): string | undefined {
  return WRAPUP_TO_ACTIVITY_DISPOSITION[normalizeWrapupToken(value)]
}

function wrapupOutcomeLabel(value: string | undefined): string | undefined {
  return WRAPUP_TO_OUTCOME[normalizeWrapupToken(value)]
}
```

## Call activity create/update

```ts
async function upsertCallActivity(args: {
  callActivityCollection: {
    list(params: Record<string, unknown>): Promise<Array<{ id?: string }>>
    create(data: Record<string, unknown>): Promise<unknown>
    update(id: string, data: Record<string, unknown>): Promise<unknown>
  }
  callRecordId: string
  phone?: string
  direction?: unknown
  input: WrapupSubmitInput
  contactId?: string
  leadId?: string
  createdCallbackId?: string | null
  resolveActivityEnum: (field: string, token: unknown) => unknown
}) {
  const mappedDisposition = wrapupDispositionLabel(args.input.disposition)
  const mappedOutcome = wrapupOutcomeLabel(args.input.disposition)
  const resolvedDisposition = args.resolveActivityEnum(
    'disposition',
    mappedDisposition ?? args.input.disposition,
  )
  const resolvedOutcome = args.resolveActivityEnum('outcome', mappedOutcome)
  const resolvedDirection = args.resolveActivityEnum(
    'direction',
    args.direction,
  )

  const payload: Record<string, unknown> = {
    call: args.callRecordId,
    phone_number: args.phone,
    disposition_notes: args.input.notes,
    followup_required: !!args.input.scheduleCallback,
    created_callback: args.createdCallbackId ?? null,
  }

  if (resolvedDirection) payload.direction = resolvedDirection
  if (resolvedOutcome) payload.outcome = resolvedOutcome
  if (resolvedDisposition) payload.disposition = resolvedDisposition
  if (args.contactId) payload.contact = args.contactId
  if (!args.contactId && args.leadId) payload.lead = args.leadId

  const existing = await args.callActivityCollection.list({
    columns: ['id'],
    filters: {
      combinator: 'and',
      rules: [{ field: 'call', operator: 'eq', value: args.callRecordId }],
    },
    limit: 1,
  })

  if (existing[0]?.id) {
    await args.callActivityCollection.update(existing[0].id, payload)
  } else {
    await args.callActivityCollection.create(payload)
  }
}
```

## Call patch sonrası

```ts
async function patchCallAfterWrapup(args: {
  callCollection: {
    update(id: string, data: Record<string, unknown>): Promise<unknown>
  }
  callRecordId: string
  input: WrapupSubmitInput
  contactId?: string
  leadId?: string
  createdCallbackId?: string | null
  talkDurationSeconds?: number
  resolveCallEnum: (field: string, token: unknown) => unknown
}) {
  const payload: Record<string, unknown> = {
    state: args.resolveCallEnum('state', 'ended'),
    outcome: args.resolveCallEnum(
      'outcome',
      wrapupOutcomeLabel(args.input.disposition),
    ),
    created_callback: args.createdCallbackId ?? null,
    is_callback: !!args.createdCallbackId,
  }

  if (args.contactId) {
    payload.contact = args.contactId
    payload.lead = null
  } else if (args.leadId) {
    payload.lead = args.leadId
    payload.contact = null
  }

  if (args.talkDurationSeconds !== undefined) {
    payload.talk_duration_seconds = args.talkDurationSeconds
  }

  await args.callCollection.update(args.callRecordId, payload)
}
```

## Pinned note create

```ts
async function createPinnedCallNote(args: {
  callScreenNoteCollection: {
    create(data: Record<string, unknown>): Promise<unknown>
  }
  noteText: string
  contactId?: string
  leadId?: string
  callbackId?: string
  sourceCallRecordId?: string
}) {
  const note = args.noteText.trim()
  if (!note) return

  if (!args.contactId && !args.leadId && !args.callbackId) {
    throw new Error('Link a customer before saving a note.')
  }

  await args.callScreenNoteCollection.create({
    note_text: note,
    contact: args.contactId,
    lead: args.contactId ? undefined : args.leadId,
    callback: args.callbackId,
    source_call: args.sourceCallRecordId,
  })
}
```

## Live notes import

```ts
function importLiveNotesIntoWrapup(args: {
  liveNotes: string
  currentWrapupNotes: string
}): string {
  if (args.currentWrapupNotes.trim()) return args.currentWrapupNotes
  return args.liveNotes.trim()
}
```

## Dikkat edilmesi gerekenler

- `call_activity` wrap-up sonucudur.
- `call_screen_note` müşteri kartında kalıcı/pinned nottur.
- Live notes tek başına kalıcı değildir.
- Callback oluşturma hedef projede yoksa `followup_required` ile yetinilebilir.
- Activity/call enumları ayrı datasource field’ları olabilir; resolver field bazlı çalışmalıdır.
