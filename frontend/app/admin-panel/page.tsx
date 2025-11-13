// app/admin-panel/page.tsx
// Admin Dashboard

export default function AdminDashboard() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Benvenuto nel pannello di amministrazione
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Settings Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Impostazioni
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    Azienda & Email
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/admin-panel/settings"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Vai alle impostazioni →
              </a>
            </div>
          </div>
        </div>

        {/* Users Management Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Gestione Utenti
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    Approva & Gestisci
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/admin-panel/users"
                className="text-sm font-medium text-green-600 hover:text-green-500"
              >
                Gestisci utenti →
              </a>
            </div>
          </div>
        </div>

        {/* Email Templates Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Template Email
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    Messaggi Clienti
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/admin-panel/email-templates"
                className="text-sm font-medium text-purple-600 hover:text-purple-500"
              >
                Gestisci template →
              </a>
            </div>
          </div>
        </div>

        {/* Reports Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Report Clienti
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    Gestione Dinamica
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/admin-panel/reports"
                className="text-sm font-medium text-orange-600 hover:text-orange-500"
              >
                Gestisci report →
              </a>
            </div>
          </div>
        </div>

        {/* Dashboard Configuration Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Dashboard KPI
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    Metriche Area Utente
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/admin-panel/dashboard-config"
                className="text-sm font-medium text-teal-600 hover:text-teal-500"
              >
                Configura dashboard →
              </a>
            </div>
          </div>
        </div>

        {/* Translations Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Traduzioni UI
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    Interfaccia Multilingua
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/admin-panel/translations"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Gestisci traduzioni →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
