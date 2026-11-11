import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  adminQueries,
  authQueries,
  useCreateUserMutation,
  useResetPasswordMutation,
  useDeleteUserMutation,
} from '../../../lib/api/queries'
import { PageHeader } from '../../../components/layout/PageHeader'
import { ResetPasswordModal } from '../../../components/ui/ResetPasswordModal'
import { useI18n } from '../../../lib/i18n'
import { ApiError } from '../../../lib/api/client'
import type { AdminUserDTO, UserRole } from '../../../lib/api/types'

export const Route = createFileRoute('/_authenticated/_admin/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { t } = useI18n()
  const { data: users, isLoading, error } = useQuery(adminQueries.users())
  const { data: session } = useQuery(authQueries.session())

  const createUserMutation = useCreateUserMutation()
  const resetPasswordMutation = useResetPasswordMutation()
  const deleteUserMutation = useDeleteUserMutation()

  // Form state
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('user')
  const [formError, setFormError] = useState<string | null>(null)

  // Reset password modal state
  const [targetUser, setTargetUser] = useState<AdminUserDTO | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentUserId = session?.user?.id

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const trimmedUser = newUsername.trim()
    if (!trimmedUser) {
      setFormError(t.setup.usernameRequired)
      return
    }

    if (newPassword.length < 8) {
      setFormError(t.setup.passwordMinLength)
      return
    }

    createUserMutation.mutate(
      {
        username: trimmedUser,
        password: newPassword,
        role: newRole,
      },
      {
        onSuccess: () => {
          setNewUsername('')
          setNewPassword('')
          setNewRole('user')
        },
        onError: (err) => {
          setFormError(err instanceof ApiError ? err.message : t.apiErrors.genericError)
        },
      },
    )
  }

  const handleDeleteUser = (user: AdminUserDTO) => {
    if (window.confirm(t.users.deleteUserConfirm(user.username))) {
      deleteUserMutation.mutate(user.id)
    }
  }

  const handleOpenResetModal = (user: AdminUserDTO) => {
    setTargetUser(user)
    setIsModalOpen(true)
  }

  const handleResetPasswordSubmit = (password: string) => {
    if (!targetUser) return

    resetPasswordMutation.mutate(
      {
        userId: targetUser.id,
        data: { password },
      },
      {
        onSuccess: () => {
          setIsModalOpen(false)
          setTargetUser(null)
        },
      },
    )
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader title={t.users.title} />

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
          {error instanceof ApiError ? error.message : t.apiErrors.genericError}
        </div>
      )}

      {/* Card: Registrar Novo Usuário (Board 6) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-3 sm:mb-4 select-none">
          {t.users.registerTitle}
        </h2>

        {formError && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-username" className="text-xs font-semibold text-slate-700">
              {t.users.username}
            </label>
            <input
              id="create-username"
              name="username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={t.users.usernamePlaceholder}
              required
              autoComplete="off"
              spellCheck={false}
              className="h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-password" className="text-xs font-semibold text-slate-700">
              {t.users.initialPassword}
            </label>
            <input
              id="create-password"
              name="password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-role" className="text-xs font-semibold text-slate-700">
              {t.users.role}
            </label>
            <select
              id="create-role"
              name="role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="h-11 px-3 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors cursor-pointer"
            >
              <option value="user">{t.common.user}</option>
              <option value="admin">{t.common.administrator}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createUserMutation.isPending}
            className="h-11 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 w-full"
          >
            {createUserMutation.isPending ? '…' : t.users.createUser}
          </button>
        </form>
      </div>

      {/* Card: Usuários Cadastrados no Sistema (Board 6) */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 font-medium">
          …
        </div>
      ) : !users || users.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 font-medium">
          {t.emptyState.interests}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col gap-4">
          <h2 className="text-base font-bold text-slate-900 select-none tabular-nums">
            {t.users.registeredUsersTitle(users.length)}
          </h2>

          {/* Mobile Users Cards (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {users.map((user: AdminUserDTO) => {
              const isSelf = currentUserId !== undefined && user.id === currentUserId

              return (
                <div key={user.id} className="py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      @{user.username}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-blue-50 border border-blue-200 text-blue-700'
                          : 'bg-slate-100 border border-slate-200 text-slate-700'
                      }`}
                    >
                      {user.role === 'admin' ? t.common.badgeAdmin : t.common.badgeUser}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-slate-500 truncate" title={user.ntfyTopic}>
                      {user.normalizedNtfyTopic || user.ntfyTopic}
                    </span>
                    <span className="font-semibold text-emerald-700 tabular-nums flex-shrink-0">
                      {t.users.termsActiveCount(user.activeInterestsCount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenResetModal(user)}
                      className="h-10 px-2 inline-flex items-center justify-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {t.users.resetPassword}
                    </button>

                    {isSelf ? (
                      <span className="h-10 px-2 inline-flex items-center justify-center text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg select-none">
                        {t.common.protected}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        disabled={deleteUserMutation.isPending}
                        className="h-10 px-2 inline-flex items-center justify-center text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        {t.users.deleteUser}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block">
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 flex items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none mb-2">
              <span className="w-56 text-left">{t.users.colUser}</span>
              <span className="w-36 text-center">{t.users.colRole}</span>
              <span className="flex-1 text-left hidden sm:inline-block">{t.users.colPublicChannel}</span>
              <span className="w-40 text-center hidden md:inline-block">{t.users.colActiveTerms}</span>
              <span className="w-52 text-right">{t.common.actionsAdmin}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {users.map((user: AdminUserDTO) => {
                const isSelf = currentUserId !== undefined && user.id === currentUserId

                return (
                  <div
                    key={user.id}
                    className="py-3.5 px-4 flex items-center hover:bg-slate-50/70 transition-colors rounded-lg gap-2"
                  >
                    <div className="w-56 text-left min-w-0 pr-2">
                      <span className="text-sm font-semibold text-slate-900 block truncate">
                        @{user.username}
                      </span>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {user.role === 'admin' ? t.common.administrator : t.common.active}
                      </span>
                    </div>

                    <div className="w-36 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-slate-100 border border-slate-200 text-slate-700'
                        }`}
                      >
                        {user.role === 'admin' ? t.common.badgeAdmin : t.common.badgeUser}
                      </span>
                    </div>

                    <div className="flex-1 text-left hidden sm:block truncate">
                      <span className="text-xs font-mono text-slate-600">
                        {user.normalizedNtfyTopic || user.ntfyTopic}
                      </span>
                    </div>

                    <div className="w-40 text-center hidden md:block">
                      <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                        {t.users.termsActiveCount(user.activeInterestsCount)}
                      </span>
                    </div>

                    <div className="w-52 text-right flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenResetModal(user)}
                        className="h-10 px-3 inline-flex items-center justify-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                      >
                        {t.users.resetPassword}
                      </button>

                      {isSelf ? (
                        <span className="h-10 px-3 inline-flex items-center justify-center text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md select-none">
                          {t.common.protected}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deleteUserMutation.isPending}
                          className="h-10 px-3 inline-flex items-center justify-center text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                        >
                          {t.users.deleteUser}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {targetUser && (
        <ResetPasswordModal
          isOpen={isModalOpen}
          username={targetUser.username}
          onClose={() => {
            setIsModalOpen(false)
            setTargetUser(null)
          }}
          onSubmit={handleResetPasswordSubmit}
          isPending={resetPasswordMutation.isPending}
        />
      )}
    </div>
  )
}
