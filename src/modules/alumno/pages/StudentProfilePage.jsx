import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../../../config/supabase.js"
import { useI18n } from "../../../i18n/I18nProvider.jsx"
import { useAuth } from "../../auth/context/AuthContext.jsx"

import StudentSidebar from "../dashboard/components/StudentSidebar.jsx"
import StudentMobileNav from "../dashboard/components/StudentMobileNav.jsx"
import StudentDashboardHeader from "../dashboard/components/StudentDashboardHeader.jsx"
import { getStudentDashboardCopy } from "../dashboard/i18n/studentDashboardCopy.js"
import { getMembershipInfo, getMembershipLabel } from "../dashboard/utils/studentDashboardUtils.js"

import StudentProfileActionPopup from "../profile/components/StudentProfileActionPopup.jsx"
import StudentProfileEditModal from "../profile/components/StudentProfileEditModal.jsx"
import StudentProfileEmailModal from "../profile/components/StudentProfileEmailModal.jsx"
import StudentProfileHero from "../profile/components/StudentProfileHero.jsx"
import StudentProfileInfoCard from "../profile/components/StudentProfileInfoCard.jsx"
import StudentProfileLoading from "../profile/components/StudentProfileLoading.jsx"
import StudentProfileMembershipCard from "../profile/components/StudentProfileMembershipCard.jsx"
import StudentProfileStats from "../profile/components/StudentProfileStats.jsx"
import { getStudentProfileCopy } from "../profile/i18n/studentProfileCopy.js"
import {
  fetchStudentProfileBundle,
  requestStudentEmailChange,
  updateStudentProfile,
  uploadStudentAvatar,
} from "../profile/services/studentProfileService.js"
import {
  calculateProfileStats,
  getInitials,
  isValidEmail,
  normalizeEmail,
  validateProfilePayload,
} from "../profile/utils/studentProfileUtils.js"

import "../../../styles/studentDashboard.css"
import "../../../styles/studentProfile.css"

const EMPTY_PROFILE_DATA = {
  profile: null,
  membership: null,
  records: [],
  exercises: [],
}

export default function StudentProfilePage() {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const { user, profile: authProfile, logout } = useAuth()

  const copy = useMemo(() => getStudentProfileCopy(locale), [locale])
  const dashboardCopy = useMemo(() => getStudentDashboardCopy(locale), [locale])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState(EMPTY_PROFILE_DATA)
  const [editOpen, setEditOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [actionPopup, setActionPopup] = useState({ open: false, message: "", description: "" })

  const showPopup = useCallback((message, description = "") => {
    setActionPopup({ open: true, message, description })
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const authUser = user || (await supabase.auth.getUser())?.data?.user
      const payload = await fetchStudentProfileBundle({ authUser, authProfile })
      setData({ ...EMPTY_PROFILE_DATA, ...payload })

      if (payload.emailSynced) showPopup(copy.emailModified)
    } catch (loadError) {
      console.error("Error loading athlete profile:", loadError)
      setError(loadError.message || copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [authProfile, copy.emailModified, copy.loadError, showPopup, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!actionPopup.open) return undefined
    const timeoutId = window.setTimeout(() => {
      setActionPopup({ open: false, message: "", description: "" })
    }, 2400)
    return () => window.clearTimeout(timeoutId)
  }, [actionPopup.open])

  const profileName = data.profile?.nombre || authProfile?.nombre || copy.athlete
  const initials = getInitials(profileName)
  const stats = useMemo(() => calculateProfileStats(data.records), [data.records])
  const membershipInfo = useMemo(() => getMembershipInfo(data.membership, new Date()), [data.membership])
  const membershipLabel = useMemo(
    () => getMembershipLabel(data.membership, membershipInfo, dashboardCopy),
    [dashboardCopy, data.membership, membershipInfo]
  )

  async function handleSaveProfile(payload) {
    try {
      setSaving(true)
      setError("")
      const cleanPayload = validateProfilePayload(payload, copy)
      const updatedProfile = await updateStudentProfile(user?.id || data.profile?.id, cleanPayload)
      setData((current) => ({ ...current, profile: updatedProfile }))
      setEditOpen(false)
      showPopup(copy.profileModified)
    } catch (saveError) {
      console.error("Error updating athlete profile:", saveError)
      setError(saveError.message || copy.updateError)
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadAvatar(file) {
    try {
      setUploading(true)
      setError("")
      const updatedProfile = await uploadStudentAvatar(user?.id || data.profile?.id, file)
      setData((current) => ({ ...current, profile: updatedProfile }))
      showPopup(copy.photoSaved)
    } catch (uploadError) {
      console.error("Error uploading athlete avatar:", uploadError)
      const message = uploadError.message === "INVALID_IMAGE_TYPE"
        ? copy.imageTypeError
        : uploadError.message === "IMAGE_TOO_LARGE"
          ? copy.imageSizeError
          : uploadError.message || copy.uploadError
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  async function handleEmailChange(form) {
    try {
      setChangingEmail(true)
      setError("")

      const newEmail = normalizeEmail(form.email)
      const currentEmail = normalizeEmail(user?.email || data.profile?.email)
      if (!isValidEmail(newEmail)) throw new Error(copy.invalidEmail)
      if (newEmail === currentEmail) throw new Error(copy.sameEmail)
      if (!form.password) throw new Error(copy.passwordRequired)

      await requestStudentEmailChange({ currentEmail, newEmail, password: form.password })
      setEmailOpen(false)
      showPopup(copy.verificationSent)
    } catch (emailError) {
      console.error("Error requesting athlete email change:", emailError)
      const mappedMessage = {
        INVALID_EMAIL: copy.invalidEmail,
        SAME_EMAIL: copy.sameEmail,
        PASSWORD_REQUIRED: copy.passwordRequired,
        INVALID_PASSWORD: copy.invalidPassword,
      }[emailError.message]
      setError(mappedMessage || emailError.message || copy.emailError)
    } finally {
      setChangingEmail(false)
    }
  }

  if (loading) return <StudentProfileLoading copy={copy} />

  return (
    <main className="student-dashboard student-profile-page">
      <StudentSidebar copy={dashboardCopy} membership={membershipLabel} navigate={navigate} onLogout={logout} />

      <section className="student-dashboard-main student-profile-main">
        <div className="student-dashboard-orb student-dashboard-orb-a" />
        <div className="student-dashboard-orb student-dashboard-orb-b" />

        <div className="student-profile-inner">
          <StudentDashboardHeader
            copy={dashboardCopy}
            profileName={profileName}
            initials={initials}
            photoUrl={data.profile?.foto_url}
            onLogout={logout}
          />

          <section className="student-profile-heading">
            <div><p>{copy.athlete}</p><h1>{copy.title}</h1><span>{copy.subtitle}</span></div>
            <button type="button" onClick={() => setEditOpen(true)}>{copy.editProfile}</button>
          </section>

          {error ? <div className="student-profile-error">{error}</div> : null}

          <StudentProfileHero
            copy={copy}
            profile={data.profile}
            initials={initials}
            membership={membershipLabel}
            stats={stats}
            uploading={uploading}
            onUpload={handleUploadAvatar}
          />

          <StudentProfileStats copy={copy} stats={stats} locale={locale} />

          <section className="student-profile-grid">
            <StudentProfileInfoCard
              copy={copy}
              profile={data.profile}
              locale={locale}
              onEdit={() => setEditOpen(true)}
              onChangeEmail={() => setEmailOpen(true)}
            />

            <StudentProfileMembershipCard
              copy={copy}
              membership={data.membership}
              membershipInfo={membershipInfo}
              membershipLabel={membershipLabel}
              locale={locale}
            />

          </section>
        </div>
      </section>

      <StudentMobileNav copy={dashboardCopy} navigate={navigate} />

      <StudentProfileEditModal
        open={editOpen}
        copy={copy}
        profile={data.profile}
        saving={saving}
        onClose={() => !saving && setEditOpen(false)}
        onSave={handleSaveProfile}
      />

      <StudentProfileEmailModal
        open={emailOpen}
        copy={copy}
        currentEmail={user?.email || data.profile?.email}
        saving={changingEmail}
        onClose={() => !changingEmail && setEmailOpen(false)}
        onSubmit={handleEmailChange}
      />

      <StudentProfileActionPopup
        open={actionPopup.open}
        message={actionPopup.message}
        description={actionPopup.description}
        copy={copy}
        onClose={() => setActionPopup({ open: false, message: "", description: "" })}
      />
    </main>
  )
}
