---
layout: layouts/base.njk
title: Menu
description: A short, obsessive menu.
---

<p class="lede">Everything here is editable. Add, remove, and reorder without touching code.</p>

<div class="cards">
{% for item in collections.menuItems | byOrder %}
  <article class="card">
    <header><h3>{{ item.data.title }}</h3></header>
    {% if item.data.description %}<p>{{ item.data.description }}</p>{% endif %}
    {% if item.data.tags %}<p><em>{{ item.data.tags | join(', ') }}</em></p>{% endif %}
    <p class="price">{{ item.data.price }}</p>
  </article>
{% endfor %}
</div>

<p class="note">Prices are placeholders. Replace with real numbers. Use tags like <code>vegan</code>, <code>spicy</code>, or <code>special</code> for quick filtering later.</p>
