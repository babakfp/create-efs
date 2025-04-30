<script lang="ts">
    import { page } from "$app/state"
</script>

<main
    class="container grid min-h-svh content-center items-center gap-2 py-8 text-center"
>
    <h1 class="text-4xl font-black">{page.status}</h1>
    {#if page.error?.message}
        <p>{page.error.message}</p>
    {/if}
</main>
