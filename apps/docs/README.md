# Documentation application

This private workspace contains the statically generated Combric documentation,
canonical Foundations browsers, component catalogue, and controlled Playground.

It consumes Combric only through public workspace package exports and is never a
dependency of a publishable framework package.

Set `COMBRIC_DOCS_SITE_URL` to the approved canonical origin when building a
hosted release. Starlight uses that origin for canonical metadata and the
sitemap. No production domain is assumed in local or pull-request builds.
