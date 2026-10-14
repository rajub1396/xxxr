import 'dart:async';
import 'dart:convert';
// This application targets Flutter Web.
// ignore: deprecated_member_use
import 'dart:html' as html;
import 'dart:ui_web' as ui;

import 'package:flutter/material.dart';

void main() => runApp(const Xxxr());
const red = Color(0xfff34350);

class Xxxr extends StatelessWidget {
  const Xxxr({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'xxxr',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xff0c0d11),
      colorScheme: const ColorScheme.dark(
        primary: red,
        secondary: red,
        surface: Color(0xff181a22),
      ),
      fontFamily: 'Arial',
      useMaterial3: true,
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
        filled: true,
      ),
    ),
    home: const AgeConfirmation(),
  );
}

class AgeConfirmation extends StatefulWidget {
  const AgeConfirmation({super.key});
  @override
  State<AgeConfirmation> createState() => _AgeConfirmationState();
}

class _AgeConfirmationState extends State<AgeConfirmation> {
  bool accepted = html.window.sessionStorage['redx-age-confirmed'] == 'yes';
  @override
  Widget build(BuildContext context) {
    if (accepted) return const Library();
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: const Color(0xff181a22),
                border: Border.all(color: const Color(0xff36303a)),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock_outline, size: 44, color: red),
                  const SizedBox(height: 20),
                  const Text(
                    'xxxr',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 3,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('the best porn site.', style: TextStyle(color: Colors.white60)),
                  const SizedBox(height: 16),
                  const Text(
                    'For adults only',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'This video library is intended for adults. By entering, you confirm that you are at least 18 years old and meet the minimum age requirement where you live.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white60, height: 1.6),
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {
                        html.window.sessionStorage['redx-age-confirmed'] =
                            'yes';
                        setState(() => accepted = true);
                      },
                      child: const Text('I am 18 or older — Enter'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () =>
                        html.window.location.assign('https://www.google.com'),
                    child: const Text('Leave this site'),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Free browsing. Sign in for premium access.',
                    style: TextStyle(fontSize: 12, color: Colors.white38),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

Future<dynamic> api(
  String path, {
  String method = 'GET',
  Map<String, dynamic>? data,
}) async {
  final r = await html.HttpRequest.request(
    '/api/$path',
    method: method,
    sendData: data == null ? null : jsonEncode(data),
    requestHeaders: data == null ? {} : {'Content-Type': 'application/json'},
  );
  return jsonDecode(r.responseText ?? '{}');
}

class Library extends StatefulWidget {
  const Library({super.key});
  @override
  State<Library> createState() => _Library();
}

class _Library extends State<Library> {
  List<dynamic> videos = [];
  Map<String, dynamic> me = {};
  Map<String, dynamic> catalog = {'categories': [], 'performers': [], 'tags': []};
  String categoryFilter = '', performerFilter = '', tagFilter = '';
  String filter = 'All videos', query = '', error = '';
  bool loading = true, adminView = false;
  Timer? timer;
  @override
  void initState() {
    super.initState();
    load();
    timer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => load(silent: true),
    );
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  Future<void> load({bool silent = false}) async {
    try {
      final results = await Future.wait([api('me'), api('videos'), api('catalog')]);
      if (mounted)
        setState(() {
          me = Map<String, dynamic>.from(results[0]);
          videos = results[1];
          catalog = Map<String, dynamic>.from(results[2]);
          if (!(catalog['categories'] as List).any((entry) => entry['id'] == categoryFilter)) categoryFilter = '';
          if (!(catalog['performers'] as List).any((entry) => entry['id'] == performerFilter)) performerFilter = '';
          if (!(catalog['tags'] as List).any((entry) => entry['id'] == tagFilter)) tagFilter = '';
          loading = false;
          error = '';
        });
    } catch (e) {
      if (mounted && !silent)
        setState(() {
          loading = false;
          error = 'Could not load videos. Please try again.';
        });
    }
  }

  void notice(String text) {
    if (mounted)
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  void signIn() => html.window.open(
    '/signin-with-chatgpt?return_to=%2Fwatch%2Findex.html',
    '_top',
  );
  Future<void> play(dynamic v) async {
    if (v['premium'] == 1 && me['premium'] != true) {
      await showDialog(
        context: context,
        builder: (c) => AlertDialog(
          title: const Text('Made for xxxr members'),
          content: Text(
            me['email'] == null
                ? 'Sign in to your xxxr account, then ask the admin to activate premium access.'
                : 'Ask the admin to activate premium access for ${me['email']}.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(c),
              child: const Text('Close'),
            ),
            if (me['email'] == null)
              FilledButton(
                onPressed: signIn,
                child: const Text('Sign in / Sign up'),
              ),
          ],
        ),
      );
      return;
    }
    try {
      final full = await api('videos/${v['id']}');
      final id = 'player-${DateTime.now().microsecondsSinceEpoch}';
      ui.platformViewRegistry.registerViewFactory(id, (_) {
        final frame = html.IFrameElement()
          ..src = full['embed']
          ..title = full['title']
          ..allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen'
          ..setAttribute('allowfullscreen', '')
          ..setAttribute(
            'sandbox',
            'allow-scripts allow-same-origin allow-presentation',
          )
          ..setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
          ..style.border = '0'
          ..style.width = '100%'
          ..style.height = '100%';
        return frame;
      });
      if (!mounted) return;
      await showDialog(
        context: context,
        builder: (c) => Dialog(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1000),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          full['title'],
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(c),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  AspectRatio(
                    aspectRatio: 16 / 9,
                    child: HtmlElementView(viewType: id),
                  ),
                  if (full['description'] != '')
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Text(full['description']),
                    ),
                ],
              ),
            ),
          ),
        ),
      );
    } catch (e) {
      notice('Unable to play this video. Check your access and try again.');
    }
  }

  Future<void> addVideo() async {
    final title = TextEditingController(),
        link = TextEditingController(),
        description = TextEditingController(),
        category = TextEditingController(text: 'General'),
        thumbnail = TextEditingController();
    bool premium = false, busy = false;
    String message = '';
    await showDialog(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (c, update) => AlertDialog(
          title: const Text('Publish a video'),
          content: SizedBox(
            width: 480,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: title,
                    maxLength: 120,
                    decoration: const InputDecoration(labelText: 'Video title'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: link,
                    decoration: const InputDecoration(
                      labelText: 'HTTPS embed URL or iframe code',
                      hintText: 'https://provider.example/embed/video-id',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: description,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Description'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: thumbnail,
                    decoration: const InputDecoration(
                      labelText: 'Preview image URL (optional)',
                      hintText: 'Leave empty for automatic detection',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: category,
                    decoration: const InputDecoration(labelText: 'Category'),
                  ),
                  SwitchListTile(
                    value: premium,
                    onChanged: (v) => update(() => premium = v),
                    title: const Text('Premium members only'),
                  ),
                  if (message.isNotEmpty)
                    Text(message, style: const TextStyle(color: red)),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: busy ? null : () => Navigator.pop(c),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: busy
                  ? null
                  : () async {
                      if (title.text.trim().isEmpty ||
                          link.text.trim().isEmpty) {
                        update(() => message = 'Enter a title and video link.');
                        return;
                      }
                      update(() => busy = true);
                      try {
                        await api(
                          'videos',
                          method: 'POST',
                          data: {
                            'title': title.text,
                            'embed': link.text,
                            'thumbnail': thumbnail.text,
                            'description': description.text,
                            'category': category.text,
                            'premium': premium,
                          },
                        );
                        if (c.mounted) Navigator.pop(c);
                        await load();
                        notice('Video published to your library.');
                      } catch (e) {
                        update(() {
                          busy = false;
                          message = 'Could not publish. Use a public HTTPS embed URL or iframe code.';
                        });
                      }
                    },
              child: Text(busy ? 'Publishing...' : 'Publish video'),
            ),
          ],
        ),
      ),
    );
    title.dispose();
    link.dispose();
    description.dispose();
    category.dispose();
    thumbnail.dispose();
  }

  Future<void> deleteVideo(dynamic v) async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Delete this video?'),
        content: Text(v['title']),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (yes == true) {
      try {
        await api('videos/${v['id']}', method: 'DELETE');
        await load();
      } catch (e) {
        notice('Could not delete video.');
      }
    }
  }

  Future<void> members() async {
    try {
      List<dynamic> people = await api('members');
      if (!mounted) return;
      await showDialog(
        context: context,
        builder: (c) => StatefulBuilder(
          builder: (c, update) => AlertDialog(
            title: const Text('Member access'),
            content: SizedBox(
              width: 580,
              height: 400,
              child: people.isEmpty
                  ? const Center(
                      child: Text('Members appear here after signing in.'),
                    )
                  : ListView(
                      children: people
                          .map(
                            (p) => SwitchListTile(
                              title: Text(p['email']),
                              subtitle: Text(
                                p['premium'] == 1
                                    ? 'Premium access'
                                    : 'Free access',
                              ),
                              value: p['premium'] == 1,
                              onChanged: (v) async {
                                try {
                                  await api(
                                    'members/${p['id']}',
                                    method: 'PATCH',
                                    data: {'premium': v},
                                  );
                                  update(() => p['premium'] = v ? 1 : 0);
                                } catch (e) {
                                  notice('Could not update membership.');
                                }
                              },
                            ),
                          )
                          .toList(),
                    ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(c),
                child: const Text('Done'),
              ),
            ],
          ),
        ),
      );
      await load();
    } catch (e) {
      notice('Could not load members.');
    }
  }

  Widget chip(String name) => Padding(
    padding: const EdgeInsets.only(right: 10, bottom: 8),
    child: ChoiceChip(
      label: Text(name),
      selected: filter == name,
      onSelected: (_) => setState(() => filter = name),
      selectedColor: red.withValues(alpha: .2),
    ),
  );
  Widget catalogDropdown(String group, String label, String value, ValueChanged<String> changed) {
    final entries = List<dynamic>.from(catalog[group] ?? []);
    return SizedBox(width: 220, child: DropdownButtonFormField<String>(
      key: ValueKey('$group-$value'), initialValue: value, isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: [DropdownMenuItem(value: '', child: Text('All ' + label.toLowerCase())), ...entries.map((entry) => DropdownMenuItem<String>(value: entry['id'].toString(), child: Text(entry['name'], overflow: TextOverflow.ellipsis)))],
      onChanged: (selected) => changed(selected ?? ''),
    ));
  }
  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width > 850;
    final shown = videos
        .where(
          (v) =>
              (filter != 'Premium' || v['premium'] == 1) &&
              (filter != 'Free to watch' || v['premium'] == 0) &&
              (categoryFilter.isEmpty || (v['categories'] as List? ?? []).any((entry) => entry['id'] == categoryFilter)) &&
              (performerFilter.isEmpty || (v['performers'] as List? ?? []).any((entry) => entry['id'] == performerFilter)) &&
              (tagFilter.isEmpty || (v['tags'] as List? ?? []).any((entry) => entry['id'] == tagFilter)) &&
              [v['title'], v['description'], v['category'], ...(v['performers'] as List? ?? []).map((entry) => entry['name']), ...(v['tags'] as List? ?? []).map((entry) => entry['name'])].join(' ').toLowerCase().contains(query.toLowerCase()),
        )
        .toList();
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: wide ? 48 : 20,
                vertical: 20,
              ),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xff242630))),
              ),
              child: Row(
                children: [
                  const Icon(Icons.play_circle_fill, color: red, size: 32),
                  const SizedBox(width: 10),
                  const Text(
                    'xxx',
                    style: TextStyle(
                      fontSize: 25,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                    ),
                  ),
                  const Text(
                    'r',
                    style: TextStyle(
                      fontSize: 25,
                      fontWeight: FontWeight.w900,
                      color: red,
                    ),
                  ),
                  if (wide) ...[
                    const SizedBox(width: 50),
                    TextButton(
                      onPressed: () => setState(() => adminView = false),
                      child: const Text('Discover'),
                    ),
                    const SizedBox(width: 20),
                    const Text(
                      'the best porn site.',
                      style: TextStyle(color: Colors.white54),
                    ),
                  ],
                  const Spacer(),
                  if (me['admin'] == true)
                    IconButton(
                      tooltip: 'Admin dashboard',
                      onPressed: () => html.window.location.assign('/admin'),
                      icon: const Icon(Icons.admin_panel_settings_outlined),
                    ),
                  if (me['email'] == null)
                    FilledButton(
                      onPressed: signIn,
                      child: Text(wide ? 'Sign in / Sign up' : 'Sign in'),
                    )
                  else
                    PopupMenuButton<String>(
                      tooltip: 'Account',
                      onSelected: (_) => html.window.open(
                        '/signout-with-chatgpt?return_to=%2Fwatch%2Findex.html',
                        '_top',
                      ),
                      itemBuilder: (_) => [
                        PopupMenuItem(enabled: false, child: Text(me['email'])),
                        const PopupMenuItem(
                          value: 'out',
                          child: Text('Sign out'),
                        ),
                      ],
                      child: Chip(
                        avatar: Icon(
                          me['premium'] == true
                              ? Icons.workspace_premium
                              : Icons.person,
                          size: 18,
                          color: red,
                        ),
                        label: Text(
                          me['premium'] == true ? 'Premium' : 'Account',
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(
                  horizontal: wide ? 48 : 20,
                  vertical: 32,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1400),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (adminView && me['admin'] == true) ...[
                          const Text(
                            'ADMIN STUDIO',
                            style: TextStyle(color: red, letterSpacing: 3),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Your library. Your rules.',
                            style: TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Publish videos instantly and manage who gets premium access.',
                            style: TextStyle(color: Colors.white60),
                          ),
                          const SizedBox(height: 24),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: [
                              FilledButton.icon(
                                onPressed: addVideo,
                                icon: const Icon(Icons.add),
                                label: const Text('Add video'),
                              ),
                              OutlinedButton.icon(
                                onPressed: members,
                                icon: const Icon(Icons.group_outlined),
                                label: const Text('Manage members'),
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),
                        ] else
                          Container(
                            width: double.infinity,
                            padding: EdgeInsets.all(wide ? 48 : 24),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(24),
                              gradient: const LinearGradient(
                                colors: [
                                  Color(0xff342026),
                                  Color(0xff191922),
                                  Color(0xff11131a),
                                ],
                              ),
                              border: Border.all(
                                color: const Color(0xff3b2930),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.bolt, color: red, size: 18),
                                    SizedBox(width: 8),
                                    Text(
                                      'THE xxxr 18+ COLLECTION',
                                      style: TextStyle(
                                        color: red,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                Text(
                                  'Your private escape.\nPress play.',
                                  style: TextStyle(
                                    fontSize: wide ? 54 : 34,
                                    fontWeight: FontWeight.w800,
                                    height: 1.08,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                const Text(
                                  'the best porn site.\nBrowse free videos or unlock the premium collection.',
                                  style: TextStyle(
                                    color: Colors.white60,
                                    fontSize: 16,
                                    height: 1.6,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                FilledButton.icon(
                                  onPressed: () =>
                                      setState(() => filter = 'Premium'),
                                  icon: const Icon(
                                    Icons.workspace_premium_outlined,
                                  ),
                                  label: const Text('Explore premium'),
                                ),
                              ],
                            ),
                          ),
                        const SizedBox(height: 36),
                        Wrap(
                          alignment: WrapAlignment.spaceBetween,
                          spacing: 24,
                          runSpacing: 16,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  adminView
                                      ? 'Published videos'
                                      : 'Explore the library',
                                  style: const TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  '${videos.length} videos • Updated automatically',
                                  style: const TextStyle(color: Colors.white38),
                                ),
                              ],
                            ),
                            SizedBox(
                              width: wide ? 300 : 260,
                              child: TextField(
                                onChanged: (v) => setState(() => query = v),
                                decoration: const InputDecoration(
                                  hintText: 'Search titles, performers, or tags',
                                  prefixIcon: Icon(Icons.search),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Wrap(
                          children: [
                            'All videos',
                            'Free to watch',
                            'Premium',
                          ].map(chip).toList(),
                        ),
                        const SizedBox(height: 16),
                        Wrap(spacing: 12, runSpacing: 12, crossAxisAlignment: WrapCrossAlignment.center, children: [
                          catalogDropdown('categories', 'Categories', categoryFilter, (value) => setState(() => categoryFilter = value)),
                          catalogDropdown('performers', 'Performers', performerFilter, (value) => setState(() => performerFilter = value)),
                          catalogDropdown('tags', 'Tags', tagFilter, (value) => setState(() => tagFilter = value)),
                          if (categoryFilter.isNotEmpty || performerFilter.isNotEmpty || tagFilter.isNotEmpty)
                            TextButton.icon(onPressed: () => setState(() { categoryFilter = ''; performerFilter = ''; tagFilter = ''; }), icon: const Icon(Icons.close), label: const Text('Clear filters')),
                        ]),
                        const SizedBox(height: 20),
                        if (loading)
                          const Center(child: CircularProgressIndicator())
                        else if (error.isNotEmpty)
                          Center(
                            child: Column(
                              children: [
                                Text(error),
                                TextButton(
                                  onPressed: load,
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          )
                        else if (shown.isEmpty)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 64),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: const Color(0xff292b35),
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              children: [
                                const Icon(
                                  Icons.video_library_outlined,
                                  size: 48,
                                  color: Colors.white30,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  videos.isEmpty
                                      ? 'The first great watch is on its way'
                                      : 'No videos match your search',
                                  style: const TextStyle(fontSize: 20),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  me['admin'] == true
                                      ? 'Add a video in Admin Studio to start your collection.'
                                      : 'Check back soon for new videos.',
                                  style: const TextStyle(color: Colors.white54),
                                ),
                                if (me['admin'] == true)
                                  TextButton(
                                    onPressed: addVideo,
                                    child: const Text('Add your first video'),
                                  ),
                              ],
                            ),
                          )
                        else
                          LayoutBuilder(
                            builder: (c, constraints) {
                              final columns = constraints.maxWidth > 1100
                                  ? 4
                                  : constraints.maxWidth > 750
                                  ? 3
                                  : constraints.maxWidth > 480
                                  ? 2
                                  : 1;
                              final width =
                                  (constraints.maxWidth - (columns - 1) * 20) /
                                  columns;
                              return Wrap(
                                spacing: 20,
                                runSpacing: 24,
                                children: shown.asMap().entries.map((entry) {
                                  final v = entry.value;
                                  return SizedBox(
                                    width: width,
                                    child: Card(
                                      clipBehavior: Clip.antiAlias,
                                      child: InkWell(
                                        onTap: () => play(v),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            AspectRatio(
                                              aspectRatio: 16 / 9,
                                              child: Container(
                                                decoration: BoxDecoration(
                                                  gradient: LinearGradient(
                                                    colors: [
                                                      Color.lerp(
                                                        const Color(0xff372534),
                                                        const Color(0xff233846),
                                                        (entry.key % 4) / 3,
                                                      )!,
                                                      const Color(0xff131620),
                                                    ],
                                                  ),
                                                ),
                                                child: Stack(
                                                  children: [
                                                    Positioned.fill(
                                                      child: Image.network(
                                                        v['thumbnail'] ?? '/video-placeholder.svg',
                                                        fit: BoxFit.cover,
                                                        webHtmlElementStrategy: WebHtmlElementStrategy.prefer,
                                                        semanticLabel: '${v['title']} video preview',
                                                        errorBuilder: (_, error, stack) => const Center(
                                                          child: Text('Preview unavailable', style: TextStyle(color: Colors.white54)),
                                                        ),
                                                      ),
                                                    ),
                                                    const Positioned.fill(
                                                      child: DecoratedBox(decoration: BoxDecoration(color: Color(0x22000000))),
                                                    ),
                                                    Center(
                                                      child: Icon(
                                                        v['premium'] == 1 &&
                                                                me['premium'] !=
                                                                    true
                                                            ? Icons.lock_outline
                                                            : Icons
                                                                  .play_circle_outline,
                                                        size: 54,
                                                        color: Colors.white70,
                                                      ),
                                                    ),
                                                    Positioned(
                                                      top: 12,
                                                      left: 12,
                                                      child: Chip(
                                                        label: Text(
                                                          v['premium'] == 1
                                                              ? 'PREMIUM'
                                                              : 'FREE',
                                                          style:
                                                              const TextStyle(
                                                                fontSize: 10,
                                                                letterSpacing:
                                                                    1,
                                                              ),
                                                        ),
                                                        backgroundColor:
                                                            v['premium'] == 1
                                                            ? red
                                                            : const Color(
                                                                0xff262a34,
                                                              ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            Padding(
                                              padding: const EdgeInsets.all(16),
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    v['category']
                                                        .toString()
                                                        .toUpperCase(),
                                                    style: const TextStyle(
                                                      color: red,
                                                      fontSize: 10,
                                                      letterSpacing: 1.5,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  if ((v['performers'] as List? ?? []).isNotEmpty)
                                                    Padding(padding: const EdgeInsets.only(bottom: 8), child: Text((v['performers'] as List).map((entry) => entry['name']).join(', '), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white60, fontSize: 12))),
                                                  Text(
                                                    v['title'],
                                                    maxLines: 2,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      fontSize: 17,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  Text(
                                                    v['description'],
                                                    maxLines: 2,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      color: Colors.white54,
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                  if (adminView)
                                                    Align(
                                                      alignment:
                                                          Alignment.centerRight,
                                                      child: IconButton(
                                                        tooltip: 'Delete video',
                                                        onPressed: () =>
                                                            deleteVideo(v),
                                                        icon: const Icon(
                                                          Icons.delete_outline,
                                                          size: 20,
                                                        ),
                                                      ),
                                                    ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              );
                            },
                          ),
                        const SizedBox(height: 48),
                        const Divider(color: Color(0xff242630)),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Text(
                            'xxxr 18+  /  For adults only.',
                            style: TextStyle(
                              color: Colors.white38,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
