/**
 * TestFlow API and web paths — single source of truth for k6 scripts.
 */

export const endpoints = {
  health: '/health',

  auth: {
    login: '/api/auth/login',
  },

  users: {
    list: '/api/users',
    byId: (id) => `/api/users/${id}`,
  },

  errors: {
    notFound: '/api/errors/404',
    validation: '/api/errors/422',
  },

  web: {
    login: '/web/login.html',
    dashboard: '/web/dashboard.html',
    team: '/web/team.html',
    settings: '/web/settings.html',
    activity: '/web/activity.html',
    components: '/web/components.html',
    wizard: '/web/wizard.html',
  },
};

export const staticPages = [
  endpoints.web.login,
  endpoints.web.dashboard,
  endpoints.web.team,
  endpoints.web.settings,
  endpoints.web.activity,
];
