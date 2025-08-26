'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function AuthPage() {
  const { data: session, status } = useSession()
  const [driveApiResult, setDriveApiResult] = useState<string>('')

  const testGoogleDriveAPI = async () => {
    if (!session?.accessToken) {
      setDriveApiResult('請先登入獲取訪問令牌')
      return
    }

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDriveApiResult(`成功連接Google Drive！\n用戶: ${data.user.displayName}\nEmail: ${data.user.emailAddress}`)
      } else {
        setDriveApiResult(`API調用失敗: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setDriveApiResult(`錯誤: ${error}`)
    }
  }

  if (status === 'loading') return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-center">
        <p>載入中...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Google 帳戶認證</h1>
      
      {!session ? (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">登入以開始使用</h2>
            <p className="text-blue-700 mb-4">
              請使用您的Google帳戶登入，以便訪問Google Drive並管理您的作業文件。
            </p>
            <button
              onClick={() => signIn('google')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              使用Google帳戶登入
            </button>
          </div>

          <div className="bg-gray-50 border p-4 rounded-lg">
            <h3 className="font-semibold mb-2">需要的權限</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>讀取您的基本個人資料資訊</li>
              <li>訪問Google Drive文件</li>
              <li>上傳和下載作業相關文件</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-green-800 mb-3">已成功登入</h2>
            <div className="space-y-2">
              <p><strong>用戶:</strong> {session.user?.name}</p>
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>狀態:</strong> <span className="text-green-600">✅ 已連接Google Drive</span></p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={testGoogleDriveAPI}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              測試Drive連接
            </button>
            <button
              onClick={() => signOut()}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              登出
            </button>
          </div>

          {driveApiResult && (
            <div className="bg-gray-50 border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">連接測試結果</h3>
              <pre className="whitespace-pre-wrap text-sm">{driveApiResult}</pre>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">下一步</h3>
            <p className="text-blue-700 text-sm">
              您現在可以返回主頁面開始上傳和處理Google Classroom作業文件。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
