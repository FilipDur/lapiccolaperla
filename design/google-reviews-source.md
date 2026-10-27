# Google reviews — evidence and update notes

Source: https://www.google.com/maps?cid=218766933573814212
Checked using the public Google Maps UI on 2026-10-25. Business name, Perlová 412/1 address, phone and lapiccolaperla.cz website matched the project.

Observed aggregate: 4.5/5, 6,366 reviews. Google displayed CJ Travels (5 stars), P Tang (3 stars) and Ben Regev (5 stars) in the initial review selection. The source data file contains 23 quoted words total across these three excerpts; their links open the place profile. The mixed review remains in the source data with its service criticism intact. No author portraits or profile attributes have been fabricated; the UI uses initials.

The verified source collection was expanded to eight reviews on 2026-10-25. Five individual-review links were discovered on https://wanderlog.com/place/details/1417335/la-piccola-perla and then opened and checked directly in the public Google Maps UI. The actual displayed Google author names and star ratings are used, including names that differ from the mirror. Each added excerpt quotes fewer than 25 words from its individual source. Ellipses mark internal omissions; relevant criticism is retained. The exact source URLs are stored with each entry in `src/restaurant/googleReviews.js` and used by its card:

- Matej Semsej — 5 stars, individual review ID `ChdDSUhNMG9nS0VQLUh2cmozZ2FTSzdnRRAB`.
- Yusuf Bucheeri — 5 stars, individual review ID `Ci9DQUlRQUNvZENodHljRjlvT2pocVRVUkRUbmhDV21sMmJHVlFjMWRrV1hkMWQwRRAB`.
- Forking Honest — 5 stars, individual review ID `Ci9DQUlRQUNvZENodHljRjlvT2toWlVtWjFOMWt3VVdJMVkyNTJOR3AyTm1OWWEyYxAB`.
- Jefna2803 — 5 stars, individual review ID `Ci9DQUlRQUNvZENodHljRjlvT2pWQ1ZIQjNWbUZoZGt0a1RIVnRiVlJ3WVVremIzYxAB`.
- Gal Kaufmann — 5 stars, individual review ID `Ci9DQUlRQUNvZENodHljRjlvT2s1YWFFVjRjekZUYlhCSU5tNXdSREJoVVhsemRYYxAB`.

At the user's request, the displayed selection contains only the seven five-star reviews from these eight verified entries. Keep all eight original entries in the source data and derive the displayed collection with `review.rating === 5`; the three-star P Tang entry is retained as evidence but excluded from the cards. The UI must identify this as a selection of five-star reviews. The aggregate remains 4.5/5 from 6,366 Google reviews, not an average or count of the displayed subset. Filtering does not change the source-check date.

Current implementation is a manually verified, dated editorial selection. Cards automatically rotate, but their content is not fetched or refreshed live. It does not claim verification of each review by Google. Update the checked date only after re-checking the source. Do not copy Sapore Vero's rating, count or review content.

Visual reference inspected: https://www.saporevero.cz/ — centred heading and aggregate, author/Google label at the top of each card, star row, text, responsive slider. The latest Perla iteration uses white rounded cards, a neutral light background, Google-colour branding and gold stars. The continuous rail pauses on hover without changing its position and resumes on pointer leave.

For future automatic refresh, Places API (New) provides rating, userRatingCount and up to five relevance-sorted reviews. It requires a configured Google Cloud project, Places API access, billing and an authorized key; none was created or enabled in this task. Keep keys server-side and request only the necessary fields. Include Google Maps and review-author attributions and review URLs returned by the API; check applicable storage/display policies before implementation.

Official references:
- https://developers.google.com/maps/documentation/places/web-service/place-details
- https://developers.google.com/maps/documentation/places/web-service/policies
- https://developers.google.com/maps/documentation/places/web-service/get-api-key
