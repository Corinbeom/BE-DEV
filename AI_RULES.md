# BlueHour AI Guardrails

## Commands

Backend

* ./gradlew test
* ./gradlew build

Frontend

* npm run build
* npm run lint

## Architecture

* All API responses must use ApiResponse<T>.

* Dependency direction must remain:

  api → domain → infra

* infra must never depend on api.

* Business logic must not live in controllers.

* Reuse existing domain modules before creating new ones.

## Project Constraints

* Gemini access must go through the existing AI integration layer.
* File upload limit: 10MB per file.
* Multipart request limit: 20MB.

## Code Changes

* Make the smallest change necessary.
* Avoid unrelated refactoring.
* Do not add features that were not requested.
* Do not generate speculative future functionality.

## Reuse First

* Check for existing DTOs before creating new DTOs.
* Check for existing services before creating new services.
* Check for existing feature modules before creating new modules.
* Reuse established API response patterns.

## Testing

* Run relevant tests before marking work complete.
* Do not disable tests to make builds pass.
* Prefer fixing failing tests over bypassing them.
* Update tests when changing behavior.

## Guardrail Maintenance

This file is a living document.

When the same mistake occurs repeatedly:

1. Identify the root cause.
2. Add a concrete rule that prevents recurrence.
3. Prefer specific instructions over general advice.

Bad:

* Write better tests.

Good:

* Do not mock repositories in integration tests.

Only document rules that are not obvious from reading the codebase.
