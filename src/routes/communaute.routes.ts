import { Router } from 'express';
import { db } from "@/lib/db";
import { CreatePostSchema } from "@/lib/types";
import { authentifierToken } from '@/middlewares/auth';
import { ajouterCommentaire, creerPost, getFeedCommunaute, getPostsByUserId, supprimerCommentaire, supprimerPost, toggleFollow, toggleLike } from '@/lib/queries/communaute.queries';

const app = Router();

// créer un post
app.post('/api/posts/creer', authentifierToken, async (req, res) => {
    try {
        const validData = CreatePostSchema.parse(req.body);
        const totalPosts = await db.post.count({ where: { auteurId: validData.auteurId } });
        if (totalPosts >= 10) {
            return res.status(403).send("Limite de 10 publications atteinte, supprimez-en une pour continuer");
        }
        if (validData.programmeId) {
            const existe = await db.post.findFirst({ where: { programmeId: validData.programmeId } });
            if (existe) {
                return res.status(403).send("Ce programme est déjà partagé dans la communauté");
            }
        }
        if (validData.planningId) {
            const existe = await db.post.findFirst({ where: { planningId: validData.planningId } });
            if (existe) {
                return res.status(403).send("Ce planning est déjà partagé dans la communauté");
            }
        }
        const post = await creerPost(validData);
        res.status(201).json(post);
    } catch (error) {
        res.status(500).send("Erreur lors de la publication");
    }
});

// récupère le feed
app.get('/api/communaute/feed', authentifierToken, async (req, res) => {
    const monId = (req as any).user.id;
    try {
        const feed = await getFeedCommunaute(monId);
        res.json(feed);
    } catch (error) {
        res.status(500).send("Erreur lors de la récupération du feed");
    }
});


app.get('/api/posts/utilisateur/:id', authentifierToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const posts = await getPostsByUserId(userId);
        res.json(posts);
    } catch (error) {
        res.status(500).send("Erreur lors de la récupération de tes posts");
    }
});

app.post('/api/posts/:id/like', authentifierToken, async (req, res) => {
    const postId = Number(req.params.id);
    const { userId } = req.body;
    try {
        const totalLikes = await toggleLike(postId, userId);
        res.json({ likesCount: totalLikes });
    } catch (error) {
        res.status(500).send("Erreur lors du like");
    }
});

app.get('/api/follow/status', authentifierToken, async (req, res) => {
    const { abonneId, starId } = req.query;
    const follow = await db.follow.findUnique({
        where: { id_abonne_id_star: { id_abonne: Number(abonneId), id_star: Number(starId) } }
    });
    res.json({ isFollowing: !!follow });
});

app.post('/api/follow/toggle', authentifierToken, async (req, res) => {
    const { abonneId, starId } = req.body;
    const result = await toggleFollow(Number(abonneId), Number(starId));
    res.json({ isFollowing: result });
});

app.post('/api/posts/:id/commentaires', authentifierToken, async (req, res) => {
    const postId = Number(req.params.id);
    const { auteurId, texte, parentId } = req.body;

    try {
        if (!texte || texte.trim() === "") {
            return res.status(400).send("Le texte du commentaire est vide");
        }

        const commentaire = await ajouterCommentaire(postId, Number(auteurId), texte, parentId ? Number(parentId) : undefined);
        res.status(201).json(commentaire);
    } catch (error) {
        res.status(500).send("Erreur lors de l'ajout du commentaire");
    }
});

// Supprimer un post
app.delete('/api/posts/:id', authentifierToken, async (req: any, res) => {
    const id = Number(req.params.id);
    const userId = req.user.id;
    try {
        const post = await db.post.findUnique({ where: { id } });
        if (!post || post.auteurId !== userId) {
            return res.status(403).send("Non autorisé");
        }
        await supprimerPost(id);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).send("Erreur lors de la suppression du post");
    }
});


app.delete('/api/commentaires/:id', authentifierToken, async (req: any, res) => {
    try {
        const id = Number(req.params.id);
        const auteurId = req.user.id;
        await supprimerCommentaire(id, auteurId);
        res.sendStatus(204);
    } catch (error) {
        res.status(500).send("Erreur lors de la suppression du commentaire");
    }
});

export default app;