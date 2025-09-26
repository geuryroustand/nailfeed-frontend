"use client"

import { useCallback } from "react"
import { useAuth as useAuthContext } from "@/context/auth-context"
import {
  AuthService,
  type AuthResponse,
  type LoginCredentials,
  type RegisterCredentials,
} from "@/lib/auth/auth-service"

export function useAuth() {
  const {
    refreshUser,
    clearUserState,
    setUserState,
    ...authState
  } = useAuthContext()

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const result = await AuthService.login(credentials)

      if (result.success) {
        if (result.user) {
          setUserState(result.user)
        }
        await refreshUser()
      }

      return result
    },
    [refreshUser, setUserState]
  )

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      const result = await AuthService.register(credentials)

      if (result.success) {
        if (result.user) {
          setUserState(result.user)
        }
        await refreshUser()
      }

      return result
    },
    [refreshUser, setUserState]
  )

  const logout = useCallback(async (): Promise<AuthResponse> => {
    const result = await AuthService.logout()

    setUserState(null)
    clearUserState({ redirect: false })
    await refreshUser()

    return result
  }, [clearUserState, refreshUser, setUserState])

  const forgotPassword = useCallback(
    async (email: string): Promise<AuthResponse> => {
      return AuthService.forgotPassword(email)
    },
    []
  )

  const resetPassword = useCallback(
    async (
      code: string,
      password: string,
      passwordConfirmation: string
    ): Promise<AuthResponse> => {
      const result = await AuthService.resetPassword(
        code,
        password,
        passwordConfirmation
      )

      if (result.success) {
        await refreshUser()
      }

      return result
    },
    [refreshUser]
  )

  return {
    ...authState,
    refreshUser,
    clearUserState,
    setUserState,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    checkAuthStatus: refreshUser,
  }
}
