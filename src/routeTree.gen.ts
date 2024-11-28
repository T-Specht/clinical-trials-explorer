/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as DisplayfilteredentriesImport } from './routes/display_filtered_entries'
import { Route as NavbarImport } from './routes/_navbar'
import { Route as IndexImport } from './routes/index'
import { Route as OnboardingWelcomeImport } from './routes/_onboarding/welcome'
import { Route as OnboardingLegacyimportImport } from './routes/_onboarding/legacy_import'
import { Route as OnboardingApiimportImport } from './routes/_onboarding/api_import'
import { Route as NavbarSettingsImport } from './routes/_navbar/settings'
import { Route as NavbarPivottableImport } from './routes/_navbar/pivottable'
import { Route as NavbarPivotDerivedPageImport } from './routes/_navbar/pivot-derived-page'
import { Route as NavbarJupyterImport } from './routes/_navbar/jupyter'
import { Route as NavbarGraphsImport } from './routes/_navbar/graphs'
import { Route as NavbarCustomfieldsImport } from './routes/_navbar/custom_fields'

// Create/Update Routes

const DisplayfilteredentriesRoute = DisplayfilteredentriesImport.update({
  path: '/display_filtered_entries',
  getParentRoute: () => rootRoute,
} as any)

const NavbarRoute = NavbarImport.update({
  id: '/_navbar',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const OnboardingWelcomeRoute = OnboardingWelcomeImport.update({
  path: '/welcome',
  getParentRoute: () => rootRoute,
} as any)

const OnboardingLegacyimportRoute = OnboardingLegacyimportImport.update({
  path: '/legacy_import',
  getParentRoute: () => rootRoute,
} as any)

const OnboardingApiimportRoute = OnboardingApiimportImport.update({
  path: '/api_import',
  getParentRoute: () => rootRoute,
} as any)

const NavbarSettingsRoute = NavbarSettingsImport.update({
  path: '/settings',
  getParentRoute: () => NavbarRoute,
} as any)

const NavbarPivottableRoute = NavbarPivottableImport.update({
  path: '/pivottable',
  getParentRoute: () => NavbarRoute,
} as any)

const NavbarPivotDerivedPageRoute = NavbarPivotDerivedPageImport.update({
  path: '/pivot-derived-page',
  getParentRoute: () => NavbarRoute,
} as any)

const NavbarJupyterRoute = NavbarJupyterImport.update({
  path: '/jupyter',
  getParentRoute: () => NavbarRoute,
} as any)

const NavbarGraphsRoute = NavbarGraphsImport.update({
  path: '/graphs',
  getParentRoute: () => NavbarRoute,
} as any)

const NavbarCustomfieldsRoute = NavbarCustomfieldsImport.update({
  path: '/custom_fields',
  getParentRoute: () => NavbarRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_navbar': {
      id: '/_navbar'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof NavbarImport
      parentRoute: typeof rootRoute
    }
    '/display_filtered_entries': {
      id: '/display_filtered_entries'
      path: '/display_filtered_entries'
      fullPath: '/display_filtered_entries'
      preLoaderRoute: typeof DisplayfilteredentriesImport
      parentRoute: typeof rootRoute
    }
    '/_navbar/custom_fields': {
      id: '/_navbar/custom_fields'
      path: '/custom_fields'
      fullPath: '/custom_fields'
      preLoaderRoute: typeof NavbarCustomfieldsImport
      parentRoute: typeof NavbarImport
    }
    '/_navbar/graphs': {
      id: '/_navbar/graphs'
      path: '/graphs'
      fullPath: '/graphs'
      preLoaderRoute: typeof NavbarGraphsImport
      parentRoute: typeof NavbarImport
    }
    '/_navbar/jupyter': {
      id: '/_navbar/jupyter'
      path: '/jupyter'
      fullPath: '/jupyter'
      preLoaderRoute: typeof NavbarJupyterImport
      parentRoute: typeof NavbarImport
    }
    '/_navbar/pivot-derived-page': {
      id: '/_navbar/pivot-derived-page'
      path: '/pivot-derived-page'
      fullPath: '/pivot-derived-page'
      preLoaderRoute: typeof NavbarPivotDerivedPageImport
      parentRoute: typeof NavbarImport
    }
    '/_navbar/pivottable': {
      id: '/_navbar/pivottable'
      path: '/pivottable'
      fullPath: '/pivottable'
      preLoaderRoute: typeof NavbarPivottableImport
      parentRoute: typeof NavbarImport
    }
    '/_navbar/settings': {
      id: '/_navbar/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof NavbarSettingsImport
      parentRoute: typeof NavbarImport
    }
    '/_onboarding/api_import': {
      id: '/_onboarding/api_import'
      path: '/api_import'
      fullPath: '/api_import'
      preLoaderRoute: typeof OnboardingApiimportImport
      parentRoute: typeof rootRoute
    }
    '/_onboarding/legacy_import': {
      id: '/_onboarding/legacy_import'
      path: '/legacy_import'
      fullPath: '/legacy_import'
      preLoaderRoute: typeof OnboardingLegacyimportImport
      parentRoute: typeof rootRoute
    }
    '/_onboarding/welcome': {
      id: '/_onboarding/welcome'
      path: '/welcome'
      fullPath: '/welcome'
      preLoaderRoute: typeof OnboardingWelcomeImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexRoute,
  NavbarRoute: NavbarRoute.addChildren({
    NavbarCustomfieldsRoute,
    NavbarGraphsRoute,
    NavbarJupyterRoute,
    NavbarPivotDerivedPageRoute,
    NavbarPivottableRoute,
    NavbarSettingsRoute,
  }),
  DisplayfilteredentriesRoute,
  OnboardingApiimportRoute,
  OnboardingLegacyimportRoute,
  OnboardingWelcomeRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_navbar",
        "/display_filtered_entries",
        "/_onboarding/api_import",
        "/_onboarding/legacy_import",
        "/_onboarding/welcome"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/_navbar": {
      "filePath": "_navbar.tsx",
      "children": [
        "/_navbar/custom_fields",
        "/_navbar/graphs",
        "/_navbar/jupyter",
        "/_navbar/pivot-derived-page",
        "/_navbar/pivottable",
        "/_navbar/settings"
      ]
    },
    "/display_filtered_entries": {
      "filePath": "display_filtered_entries.tsx"
    },
    "/_navbar/custom_fields": {
      "filePath": "_navbar/custom_fields.tsx",
      "parent": "/_navbar"
    },
    "/_navbar/graphs": {
      "filePath": "_navbar/graphs.tsx",
      "parent": "/_navbar"
    },
    "/_navbar/jupyter": {
      "filePath": "_navbar/jupyter.tsx",
      "parent": "/_navbar"
    },
    "/_navbar/pivot-derived-page": {
      "filePath": "_navbar/pivot-derived-page.tsx",
      "parent": "/_navbar"
    },
    "/_navbar/pivottable": {
      "filePath": "_navbar/pivottable.tsx",
      "parent": "/_navbar"
    },
    "/_navbar/settings": {
      "filePath": "_navbar/settings.tsx",
      "parent": "/_navbar"
    },
    "/_onboarding/api_import": {
      "filePath": "_onboarding/api_import.tsx"
    },
    "/_onboarding/legacy_import": {
      "filePath": "_onboarding/legacy_import.tsx"
    },
    "/_onboarding/welcome": {
      "filePath": "_onboarding/welcome.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
