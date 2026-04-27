import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SearchableSelect } from './SearchableSelect'
import './App.css'

const DEPARTMENT_OPTIONS = [
  'Engineering',
  'HR',
  'Operations',
  'Finance',
  'Marketing',
  'Sales',
  'Design',
  'Product',
  'Legal',
  'Customer Support',
]

const DEPARTMENT_POSITIONS: Record<string, string[]> = {
  Engineering: ['Developer', 'Senior Developer', 'Lead Developer', 'Engineer', 'Senior Engineer', 'Engineering Manager', 'Director of Engineering', 'Intern'],
  HR: ['HR Coordinator', 'Recruiter', 'HR Manager', 'HR Director', 'Intern'],
  Operations: ['Operations Coordinator', 'Operations Analyst', 'Operations Manager', 'Director of Operations', 'Intern'],
  Finance: ['Financial Analyst', 'Accountant', 'Finance Manager', 'Finance Director', 'Intern'],
  Marketing: ['Marketing Coordinator', 'Content Creator', 'Marketing Analyst', 'Marketing Manager', 'Marketing Director', 'Intern'],
  Sales: ['Sales Representative', 'Account Executive', 'Sales Manager', 'Sales Director', 'Intern'],
  Design: ['Designer', 'Senior Designer', 'Lead Designer', 'UX Researcher', 'Design Manager', 'Design Director'],
  Product: ['Product Analyst', 'Product Manager', 'Senior Product Manager', 'Director of Product', 'Intern'],
  Legal: ['Legal Counsel', 'Senior Legal Counsel', 'Legal Manager', 'Legal Director', 'Intern'],
  'Customer Support': ['Support Agent', 'Senior Support Agent', 'Support Lead', 'Support Manager', 'Support Director', 'Intern'],
}

const GENERAL_POSITIONS = ['Manager', 'Director', 'Analyst', 'Coordinator', 'Intern', 'Executive']

type Announcement = {
  id: string
  title: string
  body: string
  author: string
  owner_id: string | null
  pinned: boolean
  created_at: string
  updated_at?: string
}

type CreateAnnouncementInput = {
  title: string
  body: string
  author: string
  pinned: boolean
}

type UpdateAnnouncementInput = {
  title: string
  body: string
  author: string
  pinned: boolean
}

type AuthUser = {
  id: string
  email: string
  displayName: string
  name: string
  surname: string
  role: 'user' | 'admin'
}

type AuthResponse = {
  accessToken: string
  user: AuthUser
}

type AuthPage = 'none' | 'login' | 'register'
type FeedSortMode =
  | 'none'
  | 'pinned-latest'
  | 'publish-newest'
  | 'publish-oldest'
  | 'owned-first'
  | 'owner-name-az'
  | 'owner-name-za'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const TOKEN_STORAGE_KEY = 'announcement_board_token'
const FEED_SORT_OPTIONS: Array<{ mode: FeedSortMode; label: string }> = [
  { mode: 'none', label: 'No sort' },
  { mode: 'pinned-latest', label: 'Pinned first (latest)' },
  { mode: 'publish-newest', label: 'Publish date (newest)' },
  { mode: 'publish-oldest', label: 'Publish date (oldest)' },
  { mode: 'owned-first', label: 'Owned by me first' },
  { mode: 'owner-name-az', label: 'Owner name (A-Z)' },
  { mode: 'owner-name-za', label: 'Owner name (Z-A)' },
]

function getAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function fetchAnnouncements(): Promise<Announcement[]> {
  const response = await fetch(`${API_BASE_URL}/announcements`)
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to load announcements.')
  }

  return (await response.json()) as Announcement[]
}

async function createAnnouncement(
  payload: CreateAnnouncementInput,
  token: string,
): Promise<Announcement> {
  const response = await fetch(`${API_BASE_URL}/announcements`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create announcement.')
  }

  return (await response.json()) as Announcement
}

async function removeAnnouncement(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to delete announcement.')
  }
}

async function updateAnnouncement(
  id: string,
  payload: UpdateAnnouncementInput,
  token: string,
): Promise<Announcement> {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update announcement.')
  }

  return (await response.json()) as Announcement
}

async function togglePinAnnouncement(id: string, token: string): Promise<Announcement> {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}/pin`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to toggle pin.')
  }

  return (await response.json()) as Announcement
}

async function registerUser(
  email: string,
  password: string,
  name: string,
  surname: string,
  department: string,
  position: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name, surname, department, position }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to register.')
  }

  return (await response.json()) as AuthResponse
}

async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to login.')
  }

  return (await response.json()) as AuthResponse
}

async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Session expired. Please login again.')
  }

  return (await response.json()) as AuthUser
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

function getEditedTimestamp(announcement: Announcement): string | null {
  if (!announcement.updated_at) {
    return null
  }

  const createdMs = new Date(announcement.created_at).getTime()
  const updatedMs = new Date(announcement.updated_at).getTime()

  if (Number.isNaN(createdMs) || Number.isNaN(updatedMs)) {
    return null
  }

  if (updatedMs <= createdMs) {
    return null
  }

  return formatCreatedDate(announcement.updated_at)
}

function sortPinnedLatest(announcementsToSort: Announcement[]): Announcement[] {
  return [...announcementsToSort].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

function formatRequiredFieldsMessage(missingFields: string[]): string {
  if (missingFields.length === 1) {
    return `${missingFields[0]} is empty. Please enter the field.`
  }

  if (missingFields.length === 2) {
    return `${missingFields[0]} and ${missingFields[1]} are empty. Please enter the fields.`
  }

  const firstFields = missingFields.slice(0, -1).join(', ')
  const lastField = missingFields[missingFields.length - 1]
  return `${firstFields}, and ${lastField} are empty. Please enter the fields.`
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null)
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null)
  const [isEditingSelected, setIsEditingSelected] = useState(false)
  const [showOwnerMenu, setShowOwnerMenu] = useState(false)
  const [announcementActionConfirm, setAnnouncementActionConfirm] = useState<
    { type: 'delete' | 'pin'; announcement: Announcement } | null
  >(null)
  const [showSaveEditConfirm, setShowSaveEditConfirm] = useState(false)
  const [feedSortMode, setFeedSortMode] = useState<FeedSortMode>('none')
  const ownerMenuRef = useRef<HTMLDivElement | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [pinned, setPinned] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editPinned, setEditPinned] = useState(false)

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false)
  const [pendingRegisterPayload, setPendingRegisterPayload] = useState<Parameters<typeof registerUser> | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authSurname, setAuthSurname] = useState('')
  const [authDepartment, setAuthDepartment] = useState('')
  const [authPosition, setAuthPosition] = useState('')

  // Reset auth form whenever the user navigates to/from auth pages
  useEffect(() => {
    setAuthEmail('')
    setAuthPassword('')
    setAuthName('')
    setAuthSurname('')
    setAuthDepartment('')
    setAuthPosition('')
    setAuthError(null)
  }, [location.pathname])

  const authPage: AuthPage =
    location.pathname === '/login'
      ? 'login'
      : location.pathname === '/register'
        ? 'register'
        : 'none'

  const defaultAuthor = currentUser
    ? `${currentUser.name} ${currentUser.surname}`.trim()
    : ''

  useEffect(() => {
    if (defaultAuthor) {
      setAuthor(defaultAuthor)
    }
  }, [defaultAuthor])

  const sortedAnnouncements = useMemo(() => {
    const byDateDesc = (a: Announcement, b: Announcement) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

    const byDateAsc = (a: Announcement, b: Announcement) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()

    const bySelectedMode = (a: Announcement, b: Announcement) => {
      if (feedSortMode === 'none' || feedSortMode === 'pinned-latest') {
        return byDateDesc(a, b)
      }

      if (feedSortMode === 'publish-newest') {
        return byDateDesc(a, b)
      }

      if (feedSortMode === 'publish-oldest') {
        return byDateAsc(a, b)
      }

      if (feedSortMode === 'owned-first') {
        const currentUserId = currentUser?.id
        if (currentUserId) {
          const aOwned = a.owner_id === currentUserId
          const bOwned = b.owner_id === currentUserId
          if (aOwned !== bOwned) {
            return aOwned ? -1 : 1
          }
        }
        return byDateDesc(a, b)
      }

      if (feedSortMode === 'owner-name-az') {
        const byOwner = a.author.localeCompare(b.author, undefined, { sensitivity: 'base' })
        return byOwner !== 0 ? byOwner : byDateDesc(a, b)
      }

      const byOwner = b.author.localeCompare(a.author, undefined, { sensitivity: 'base' })
      return byOwner !== 0 ? byOwner : byDateDesc(a, b)
    }

    const pinnedAnnouncements = announcements.filter((announcement) => announcement.pinned)
    const unpinnedAnnouncements = announcements.filter((announcement) => !announcement.pinned)

    return [
      ...pinnedAnnouncements.sort(bySelectedMode),
      ...unpinnedAnnouncements.sort(bySelectedMode),
    ]
  }, [announcements, feedSortMode, currentUser?.id])

  const selectedAnnouncement = useMemo(() => {
    if (!selectedAnnouncementId) {
      return null
    }

    return announcements.find((announcement) => announcement.id === selectedAnnouncementId) ?? null
  }, [announcements, selectedAnnouncementId])

  const canManageSelected =
    !!selectedAnnouncement && !!currentUser && selectedAnnouncement.owner_id === currentUser.id

  function isOwnedByCurrentUser(announcement: Announcement): boolean {
    if (!currentUser || !announcement.owner_id) {
      return false
    }

    return currentUser.id === announcement.owner_id
  }

  async function loadAnnouncements() {
    setListLoading(true)
    setListError(null)

    try {
      const data = await fetchAnnouncements()
      setAnnouncements(sortPinnedLatest(data))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load announcements.'
      setListError(message)
    } finally {
      setListLoading(false)
    }
  }

  function setSession(authResponse: AuthResponse) {
    localStorage.setItem(TOKEN_STORAGE_KEY, authResponse.accessToken)
    setToken(authResponse.accessToken)
    setCurrentUser(authResponse.user)
    navigate('/')
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setCurrentUser(null)
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError(null)
    setAuthLoading(true)

    try {
      if (authPage === 'register') {
        const missingFields: string[] = []
        if (!authName.trim()) missingFields.push('Name')
        if (!authSurname.trim()) missingFields.push('Surname')
        if (!authDepartment.trim()) missingFields.push('Department')
        if (!authPosition.trim()) missingFields.push('Position')

        if (missingFields.length > 0) {
          setAuthError(formatRequiredFieldsMessage(missingFields))
          return
        }

        if (!authEmail.trim()) {
          setAuthError('Email is required.')
          return
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(authEmail.trim())) {
          setAuthError('Please enter a valid email address (e.g. you@company.com).')
          return
        }
        if (!authPassword) {
          setAuthError('Password is required.')
          return
        }
        if (authPassword.length < 6) {
          setAuthError('Password must be at least 6 characters long.')
          return
        }
        if (!/[A-Z]/.test(authPassword)) {
          setAuthError('Password must contain at least one uppercase letter.')
          return
        }
        if (!/[0-9]/.test(authPassword)) {
          setAuthError('Password must contain at least one number.')
          return
        }

        setPendingRegisterPayload([authEmail.trim(), authPassword, authName.trim(), authSurname.trim(), authDepartment.trim(), authPosition.trim()])
        setShowRegisterConfirm(true)
        return
      } else {
        if (!authEmail.trim()) {
          setAuthError('Email is required.')
          return
        }
        const emailPatternLogin = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPatternLogin.test(authEmail.trim())) {
          setAuthError('Please enter a valid email address.')
          return
        }
        if (!authPassword) {
          setAuthError('Password is required.')
          return
        }
        const response = await loginUser(authEmail.trim(), authPassword)
        setSession(response)
      }

      setAuthEmail('')
      setAuthPassword('')
      setAuthName('')
      setAuthSurname('')
      setAuthDepartment('')
      setAuthPosition('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.'
      setAuthError(message)
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    setShowLogoutConfirm(true)
  }

  function confirmLogout() {
    clearSession()
    setShowLogoutConfirm(false)
    setSelectedAnnouncementId(null)
    setIsEditingSelected(false)
    setToast('Logged out successfully!')
    setTimeout(() => setToast(null), 3000)
    navigate('/')
  }

  useEffect(() => {
    loadAnnouncements().catch(() => {
      // loadAnnouncements already handles its own error state
    })
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    fetchCurrentUser(token)
      .then((user) => setCurrentUser(user))
      .catch(() => {
        clearSession()
        setAuthError('Session expired. Please login again.')
      })
  }, [token])

  useEffect(() => {
    if (!showOwnerMenu) {
      return
    }

    function handleDocumentPointerDown(event: globalThis.MouseEvent) {
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(event.target as Node)) {
        setShowOwnerMenu(false)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowOwnerMenu(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showOwnerMenu])

  async function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!token) {
      setFormError('Login is required to publish announcements.')
      return
    }

    const missingFields: string[] = []

    if (!title.trim()) {
      missingFields.push('Title')
    }

    if (!body.trim()) {
      missingFields.push('Body')
    }

    if (!author.trim()) {
      missingFields.push('Author')
    }

    if (missingFields.length > 0) {
      setFormError(formatRequiredFieldsMessage(missingFields))
      return
    }

    setCreateLoading(true)
    try {
      const created = await createAnnouncement(
        {
          title: title.trim(),
          body: body.trim(),
          author: author.trim(),
          pinned,
        },
        token,
      )

      setAnnouncements((previous) => sortPinnedLatest([created, ...previous]))
      setIsEditingSelected(false)
      setDetailError(null)
      setTitle('')
      setBody('')
      setAuthor(defaultAuthor)
      setPinned(false)
      setToast('Announcement published successfully!')
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create announcement.'
      setFormError(message)
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDeleteAnnouncement(announcement: Announcement) {
    if (!token || !isOwnedByCurrentUser(announcement)) {
      return
    }

    setDeletingId(announcement.id)
    setListError(null)

    try {
      await removeAnnouncement(announcement.id, token)
      setAnnouncements((previous) =>
        previous.filter((item) => item.id !== announcement.id),
      )
      setSelectedAnnouncementId((previous) =>
        previous === announcement.id ? null : previous,
      )
      setIsEditingSelected(false)
      setDetailError(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not delete announcement.'
      setDetailError(message)
    } finally {
      setDeletingId(null)
    }
  }

  function handleTogglePin(announcement: Announcement, event: MouseEvent) {
    event.stopPropagation()

    if (!token) {
      return
    }

    setAnnouncementActionConfirm({ type: 'pin', announcement })
  }

  async function confirmTogglePin(announcement: Announcement) {
    if (!token) {
      return
    }

    setTogglingPinId(announcement.id)
    try {
      const updated = await togglePinAnnouncement(announcement.id, token)
      setAnnouncements((previous) =>
        sortPinnedLatest(previous.map((item) => (item.id === updated.id ? updated : item))),
      )
      setToast(updated.pinned ? 'Announcement pinned successfully!' : 'Announcement unpinned successfully!')
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not toggle pin status.'
      setListError(message)
    } finally {
      setTogglingPinId(null)
    }
  }

  function handleSelectAnnouncement(announcement: Announcement) {
    setSelectedAnnouncementId(announcement.id)
    setIsEditingSelected(false)
    setShowOwnerMenu(false)
    setDetailError(null)
  }

  function closeSelectedAnnouncement() {
    setSelectedAnnouncementId(null)
    setIsEditingSelected(false)
    setShowOwnerMenu(false)
    setAnnouncementActionConfirm(null)
    setShowSaveEditConfirm(false)
    setDetailError(null)
  }

  function requestEditAnnouncement(announcement: Announcement) {
    if (!isOwnedByCurrentUser(announcement)) {
      return
    }

    setShowOwnerMenu(false)
    startEditingAnnouncement(announcement)
  }

  function requestDeleteAnnouncement(announcement: Announcement) {
    if (!isOwnedByCurrentUser(announcement)) {
      return
    }

    setShowOwnerMenu(false)
    setAnnouncementActionConfirm({ type: 'delete', announcement })
  }

  async function confirmAnnouncementAction() {
    if (!announcementActionConfirm) {
      return
    }

    const { announcement, type } = announcementActionConfirm
    setAnnouncementActionConfirm(null)

    if (type === 'delete') {
      await handleDeleteAnnouncement(announcement)
    } else {
      await confirmTogglePin(announcement)
    }
  }

  function startEditingAnnouncement(announcement: Announcement) {
    if (!isOwnedByCurrentUser(announcement)) {
      return
    }

    setEditTitle(announcement.title)
    setEditBody(announcement.body)
    setEditAuthor(announcement.author)
    setEditPinned(announcement.pinned)
    setIsEditingSelected(true)
    setShowOwnerMenu(false)
    setDetailError(null)
  }

  function cancelEditingAnnouncement() {
    setIsEditingSelected(false)
    setShowSaveEditConfirm(false)
    setDetailError(null)
  }

  function handleUpdateSelectedAnnouncement() {
    if (!selectedAnnouncement || !token || !isOwnedByCurrentUser(selectedAnnouncement)) {
      return
    }

    const missingFields: string[] = []

    if (!editTitle.trim()) {
      missingFields.push('Title')
    }

    if (!editBody.trim()) {
      missingFields.push('Body')
    }

    if (!editAuthor.trim()) {
      missingFields.push('Author')
    }

    if (missingFields.length > 0) {
      setDetailError(formatRequiredFieldsMessage(missingFields))
      return
    }

    setShowSaveEditConfirm(true)
  }

  async function confirmSaveEditedAnnouncement() {
    if (!selectedAnnouncement || !token || !isOwnedByCurrentUser(selectedAnnouncement)) {
      return
    }

    setUpdateLoading(true)
    setShowSaveEditConfirm(false)
    setDetailError(null)

    try {
      const updated = await updateAnnouncement(
        selectedAnnouncement.id,
        {
          title: editTitle.trim(),
          body: editBody.trim(),
          author: editAuthor.trim(),
          pinned: editPinned,
        },
        token,
      )

      setAnnouncements((previous) =>
        sortPinnedLatest(previous.map((announcement) =>
          announcement.id === updated.id ? updated : announcement,
        )),
      )
      setIsEditingSelected(false)
      setToast('Announcement updated successfully!')
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update announcement.'
      setDetailError(message)
    } finally {
      setUpdateLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <header className="hero-banner">
        <p className="eyebrow">Internal Comms</p>
        <h1>Announcement Board</h1>
        <p className="subtitle">
         Where updates live and important things refuse to get lost!
        </p>
      </header>

      {toast && <div className="toast">{toast}</div>}

      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button type="button" onClick={confirmLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      {showRegisterConfirm && pendingRegisterPayload && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Create your account as <strong>{pendingRegisterPayload[2]} {pendingRegisterPayload[3]}</strong>?</p>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => { setShowRegisterConfirm(false); setPendingRegisterPayload(null) }}>Cancel</button>
              <button
                type="button"
                disabled={authLoading}
                onClick={async () => {
                  if (!pendingRegisterPayload) return
                  setAuthLoading(true)
                  setShowRegisterConfirm(false)
                  try {
                    const response = await registerUser(...pendingRegisterPayload)
                    setSession(response)
                    setAuthEmail('')
                    setAuthPassword('')
                    setAuthName('')
                    setAuthSurname('')
                    setAuthDepartment('')
                    setAuthPosition('')
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Registration failed.'
                    setAuthError(message)
                  } finally {
                    setAuthLoading(false)
                    setPendingRegisterPayload(null)
                  }
                }}
              >
                {authLoading ? 'Creating account...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {announcementActionConfirm ? (
        <div className="modal-overlay">
          <div className="modal">
            <p>
              {announcementActionConfirm.type === 'delete'
                ? `Delete announcement "${announcementActionConfirm.announcement.title}"? This action cannot be undone.`
                : `${announcementActionConfirm.announcement.pinned ? 'Unpin' : 'Pin'} announcement "${announcementActionConfirm.announcement.title}"?`}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setAnnouncementActionConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={announcementActionConfirm.type === 'delete' ? 'danger-link' : undefined}
                disabled={
                  announcementActionConfirm.type === 'delete'
                    ? deletingId === announcementActionConfirm.announcement.id
                    : togglingPinId === announcementActionConfirm.announcement.id
                }
                onClick={() => {
                  confirmAnnouncementAction().catch(() => {
                    // Error state is handled by the action handlers
                  })
                }}
              >
                {announcementActionConfirm.type === 'delete'
                  ? deletingId === announcementActionConfirm.announcement.id
                    ? 'Deleting...'
                    : 'Yes, Delete'
                  : togglingPinId === announcementActionConfirm.announcement.id
                    ? announcementActionConfirm.announcement.pinned
                      ? 'Unpinning...'
                      : 'Pinning...'
                    : announcementActionConfirm.announcement.pinned
                      ? 'Yes, Unpin'
                      : 'Yes, Pin'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSaveEditConfirm && selectedAnnouncement ? (
        <div className="modal-overlay">
          <div className="modal">
            <p>{`Save changes to "${selectedAnnouncement.title}"?`}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowSaveEditConfirm(false)}
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmSaveEditedAnnouncement().catch(() => {
                    // Error state is handled by confirmSaveEditedAnnouncement
                  })
                }}
                disabled={updateLoading}
              >
                {updateLoading ? 'Saving...' : 'Yes, Save changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="panel auth-panel" aria-labelledby="auth-heading">
        {/* <div className="panel-header">
          <h2 id="auth-heading">Account</h2>
        </div> */}

        {currentUser ? (
          <div className="auth-callout">
            <p className="auth-status">
              Welcome <strong>{currentUser.name} {currentUser.surname}</strong>!
            </p>
            <button type="button" className="ghost-button" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className="auth-callout">
            <p className="auth-status">Please login before publish an announcement.</p>
            <div className="auth-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  navigate('/login')
                  setAuthError(null)
                }}
              >
                Login
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  navigate('/register')
                  setAuthError(null)
                }}
              >
                Register
              </button>
            </div>
          </div>
        )}
      </section>

      {!currentUser && authPage !== 'none' ? (
        <section className="panel auth-screen" aria-labelledby="auth-screen-heading">
          <div className="panel-header">
            <h2 id="auth-screen-heading">{authPage === 'login' ? 'Login' : 'Register'}</h2>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                navigate('/')
                setAuthError(null)
              }}
            >
              Back
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authPage === 'register' ? (
              <>
                <label>
                  Name
                  <input
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="John"
                    maxLength={120}
                  />
                </label>

                <label>
                  Surname
                  <input
                    value={authSurname}
                    onChange={(event) => setAuthSurname(event.target.value)}
                    placeholder="Doe"
                    maxLength={120}
                  />
                </label>

                <SearchableSelect
                  label="Department"
                  options={DEPARTMENT_OPTIONS}
                  value={authDepartment}
                  onChange={(val) => { setAuthDepartment(val); setAuthPosition('') }}
                  placeholder="Select department..."
                  clearable
                />

                <SearchableSelect
                  label="Position"
                  options={authDepartment ? (DEPARTMENT_POSITIONS[authDepartment] ?? GENERAL_POSITIONS) : GENERAL_POSITIONS}
                  value={authPosition}
                  onChange={setAuthPosition}
                  placeholder={authDepartment ? 'Select position...' : 'Select a department first'}
                  clearable
                  disabled={!authDepartment}
                />
              </>
            ) : null}

            <label>
              Email
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
              />
              {authPage === 'register' && (
                <span className="field-hint">Min. 6 characters, include at least one uppercase letter and one number.</span>
              )}
            </label>

            {authError ? <p className="form-error">{authError}</p> : null}

            <button type="submit" disabled={authLoading}>
              {authLoading
                ? authPage === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : authPage === 'login'
                  ? 'Login'
                  : 'Register'}
            </button>
          </form>
        </section>
      ) : (
      <main className="layout-grid">
        <section className="panel" aria-labelledby="create-heading">
          <div className="panel-header">
            <h2 id="create-heading">Add New Announcement!</h2>
          </div>

          <form className="announcement-form" onSubmit={handleCreateAnnouncement}>
            <label>
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Product launch update"
                maxLength={120}
                disabled={!currentUser}
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
                disabled={!currentUser}
              />
            </label>

            <label>
              Author
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Your name or team"
                maxLength={120}
                disabled={!currentUser}
              />
            </label>

            <label className="pin-toggle">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
                disabled={!currentUser}
              />
              Pin this announcement
            </label>

            {formError ? <p className="form-error">{formError}</p> : null}

            <button type="submit" disabled={createLoading || !currentUser}>
              {createLoading
                ? 'Publishing...'
                : currentUser
                  ? 'Publish announcement'
                  : 'Login to publish'}
            </button>
          </form>
        </section>

        <section className="panel" aria-labelledby="list-heading">
          <div className="panel-header">
            <h2 id="list-heading">Feed</h2>
            <div className="panel-actions">
              <label className="sort-select-wrap" aria-label="Sort feed">
                <span>Sort</span>
                <select
                  className="sort-select"
                  value={feedSortMode}
                  onChange={(event) => setFeedSortMode(event.target.value as FeedSortMode)}
                >
                  {FEED_SORT_OPTIONS.map((option) => (
                    <option key={option.mode} value={option.mode}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="ghost-button"
                onClick={loadAnnouncements}
                disabled={listLoading}
              >
                Refresh
              </button>
            </div>
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

          {!listLoading && sortedAnnouncements.length === 0 ? (
            <div className="state-box">
              <p>No announcements yet. Add your first update.</p>
            </div>
          ) : null}

          {!listLoading && sortedAnnouncements.length > 0 ? (
            <ul className="announcement-list">
              {sortedAnnouncements.map((announcement) => (
                <li
                  key={announcement.id}
                  className={
                    announcement.id === selectedAnnouncementId
                      ? announcement.pinned
                        ? 'announcement pinned selected'
                        : 'announcement selected'
                      : announcement.pinned
                        ? 'announcement pinned'
                        : 'announcement'
                  }
                >
                  <button
                    type="button"
                    className="announcement-hit-area"
                    onClick={() => handleSelectAnnouncement(announcement)}
                  >
                    <div className="announcement-top-row">
                      <div className="announcement-title-wrap">
                        <button
                          type="button"
                          className={announcement.pinned ? 'pin-marker-toggle pinned' : 'pin-marker-toggle'}
                          aria-label={announcement.pinned ? 'Unpin announcement' : 'Pin announcement'}
                          title={announcement.pinned ? 'Unpin' : 'Pin'}
                          disabled={togglingPinId === announcement.id || !token}
                          onClick={(event) => handleTogglePin(announcement, event)}
                        >
                          {announcement.pinned ? '📌' : '📍'}
                        </button>
                        <h3>{announcement.title}</h3>
                      </div>
                      {announcement.pinned ? <span className="badge">PINNED</span> : null}
                    </div>

                    <p className="body-text">{announcement.body}</p>

                    <p className="meta">
                      {announcement.author} • {formatCreatedDate(announcement.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </main>
      )}

      {selectedAnnouncement ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeSelectedAnnouncement}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="announcement-detail-title">{selectedAnnouncement.title}</h3>
              <div className="modal-header-actions">
                {canManageSelected && !isEditingSelected ? (
                  <div className="owner-menu-wrap" ref={ownerMenuRef}>
                    <button
                      type="button"
                      className="ghost-button owner-menu-trigger"
                      aria-label="Open actions"
                      aria-expanded={showOwnerMenu}
                      onClick={() => setShowOwnerMenu((previous) => !previous)}
                    >
                      ⋮
                    </button>

                    <div
                      className={showOwnerMenu ? 'owner-menu open' : 'owner-menu'}
                      role="menu"
                      aria-label="Announcement actions"
                      aria-hidden={!showOwnerMenu}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        tabIndex={showOwnerMenu ? 0 : -1}
                        onClick={() => requestEditAnnouncement(selectedAnnouncement)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="danger-link"
                        tabIndex={showOwnerMenu ? 0 : -1}
                        disabled={deletingId === selectedAnnouncement.id}
                        onClick={() => requestDeleteAnnouncement(selectedAnnouncement)}
                      >
                        {deletingId === selectedAnnouncement.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="ghost-button modal-close"
                  onClick={closeSelectedAnnouncement}
                >
                  Close
                </button>
              </div>
            </div>

            <p className="meta">
              {selectedAnnouncement.author} • {formatCreatedDate(selectedAnnouncement.created_at)}
            </p>

            {getEditedTimestamp(selectedAnnouncement) ? (
              <p className="edited-tag">
                Last edited: {getEditedTimestamp(selectedAnnouncement)}
              </p>
            ) : null}

            {isEditingSelected && canManageSelected ? (
              <div className="detail-editor">
                <label>
                  Title
                  <input
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    maxLength={120}
                  />
                </label>

                <label>
                  Body
                  <textarea
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value)}
                    rows={6}
                    maxLength={2000}
                  />
                </label>

                <label>
                  Author
                  <input
                    value={editAuthor}
                    onChange={(event) => setEditAuthor(event.target.value)}
                    maxLength={120}
                  />
                </label>

                <label className="pin-toggle">
                  <input
                    type="checkbox"
                    checked={editPinned}
                    onChange={(event) => setEditPinned(event.target.checked)}
                  />
                  Pin this announcement
                </label>

                {detailError ? <p className="form-error">{detailError}</p> : null}

                <div className="detail-actions">
                  <button
                    type="button"
                    onClick={handleUpdateSelectedAnnouncement}
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={cancelEditingAnnouncement}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="body-text detail-body">{selectedAnnouncement.body}</p>

                {detailError ? <p className="form-error">{detailError}</p> : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
