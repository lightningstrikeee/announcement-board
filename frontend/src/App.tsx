import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Announcement = {
  id: string
  title: string
  body: string
  author: string
  pinned: boolean
  created_at: string
}

type CreateAnnouncementInput = {
  title: string
  body: string
  author: string
  pinned: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function fetchAnnouncements(): Promise<Announcement[]> {
  const response = await fetch(`${API_BASE_URL}/announcements`)
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to load announcements.')
  }

  const data = (await response.json()) as Announcement[]
  return data
}

async function createAnnouncement(
  payload: CreateAnnouncementInput,
): Promise<Announcement> {
  const response = await fetch(`${API_BASE_URL}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create announcement.')
  }

  return (await response.json()) as Announcement
}

async function removeAnnouncement(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete announcement.')
  }
}

function formatCreatedDate(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function App() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [pinned, setPinned] = useState(false)

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [announcements])

  async function loadAnnouncements() {
    setListLoading(true)
    setListError(null)

    try {
      const data = await fetchAnnouncements()
      setAnnouncements(data)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load announcements.'
      setListError(message)
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    fetchAnnouncements()
      .then((data) => {
        if (!active) {
          return
        }
        setAnnouncements(data)
        setListError(null)
      })
      .catch((error) => {
        if (!active) {
          return
        }
        const message =
          error instanceof Error ? error.message : 'Could not load announcements.'
        setListError(message)
      })
      .finally(() => {
        if (active) {
          setListLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!title.trim() || !body.trim() || !author.trim()) {
      setFormError('Title, body, and author are required.')
      return
    }

    setCreateLoading(true)
    try {
      const created = await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        author: author.trim(),
        pinned,
      })

      setAnnouncements((previous) => [created, ...previous])
      setTitle('')
      setBody('')
      setAuthor('')
      setPinned(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create announcement.'
      setFormError(message)
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDeleteAnnouncement(announcement: Announcement) {
    const isConfirmed = window.confirm(
      `Delete announcement "${announcement.title}"? This action cannot be undone.`,
    )

    if (!isConfirmed) {
      return
    }

    setDeletingId(announcement.id)
    setListError(null)

    try {
      await removeAnnouncement(announcement.id)
      setAnnouncements((previous) =>
        previous.filter((item) => item.id !== announcement.id),
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not delete announcement.'
      setListError(message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page-shell">
      <header className="hero-banner">
        <p className="eyebrow">Internal Comms</p>
        <h1>Announcement Board</h1>
        <p className="subtitle">
          Create updates for your team and keep critical announcements pinned on
          top.
        </p>
      </header>

      <main className="layout-grid">
        <section className="panel" aria-labelledby="create-heading">
          <div className="panel-header">
            <h2 id="create-heading">New announcement</h2>
          </div>

          <form className="announcement-form" onSubmit={handleCreateAnnouncement}>
            <label>
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Product launch update"
                maxLength={120}
              />
            </label>

            <label>
              Body
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={6}
                placeholder="Write details for your team..."
                maxLength={2000}
              />
            </label>

            <label>
              Author
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Engineering Lead"
                maxLength={80}
              />
            </label>

            <label className="pin-toggle">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
              />
              Pin this announcement
            </label>

            {formError ? <p className="form-error">{formError}</p> : null}

            <button type="submit" disabled={createLoading}>
              {createLoading ? 'Publishing...' : 'Publish announcement'}
            </button>
          </form>
        </section>

        <section className="panel" aria-labelledby="list-heading">
          <div className="panel-header">
            <h2 id="list-heading">Feed</h2>
            <button
              type="button"
              className="ghost-button"
              onClick={loadAnnouncements}
              disabled={listLoading}
            >
              Refresh
            </button>
          </div>

          {listLoading ? (
            <div className="state-box" role="status" aria-live="polite">
              <p>Loading announcements...</p>
            </div>
          ) : null}

          {listError ? (
            <div className="state-box error" role="alert">
              <p>{listError}</p>
              <button type="button" onClick={loadAnnouncements}>
                Retry
              </button>
            </div>
          ) : null}

          {!listLoading && !listError && sortedAnnouncements.length === 0 ? (
            <div className="state-box">
              <p>No announcements yet. Add your first update.</p>
            </div>
          ) : null}

          {!listLoading && !listError ? (
            <ul className="announcement-list">
              {sortedAnnouncements.map((announcement) => (
                <li
                  key={announcement.id}
                  className={announcement.pinned ? 'announcement pinned' : 'announcement'}
                >
                  <div className="announcement-top-row">
                    <h3>{announcement.title}</h3>
                    {announcement.pinned ? <span className="badge">PINNED</span> : null}
                  </div>

                  <p className="body-text">{announcement.body}</p>

                  <p className="meta">
                    {announcement.author} • {formatCreatedDate(announcement.created_at)}
                  </p>

                  <button
                    type="button"
                    className="danger-link"
                    disabled={deletingId === announcement.id}
                    onClick={() => handleDeleteAnnouncement(announcement)}
                  >
                    {deletingId === announcement.id ? 'Deleting...' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </main>
    </div>
  )
}

export default App
