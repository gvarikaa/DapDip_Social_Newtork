import { imagekit } from "@/utils";
import CustomImage from "./CustomImage";
import PostInfo from "./PostInfo";
import PostInteractions from "./PostInteractions";
import Video from "./Video";
import Link from "next/link";
import { Post as PostType } from "@prisma/client";
import { format } from "timeago.js";
import FactCheckButton from "./FactCheckButton";

type UserSummary = {
  displayName: string | null;
  username: string;
  img: string | null | undefined;  // დავამატოთ undefined ტიპი
  gender?: string | null | undefined; // დავამატოთ null და undefined ტიპები
};

type Engagement = {
  _count: { likes: number; rePosts: number; comments: number };
  likes: { id: number }[];
  rePosts: { id: number }[];
  saves: { id: number }[];
};

type PostWithDetails = PostType &
  Engagement & {
    user: UserSummary;
    rePost?: (PostType & Engagement & { user: UserSummary }) | null;
  };

const Post = ({
  type,
  post,
}: {
  type?: "status" | "comment";
  post: PostWithDetails;
}) => {
  // შევამოწმოთ არის თუ არა post და user ობიექტები დეფინირებული
  if (!post || !post.user) {
    console.error("Post or user is undefined:", post);
    return null;
  }

  const originalPost = post.rePost || post;

  // დავრწმუნდეთ, რომ originalPost.user არსებობს
  if (!originalPost.user) {
    console.error("Original post user is undefined:", originalPost);
    return null;
  }

  return (
    <div className="p-4 border-y-[1px] border-borderGray">
      {/* POST TYPE */}
      {post.rePostId && (
        <div className="flex items-center gap-2 text-sm text-textGray mb-2 from-bold">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
          >
            <path
              fill="#71767b"
              d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13V20H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 2.71H11V4h5.25c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3-4.603-4.3 1.706-1.82L18 15.62V8.25c0-.97-.784-1.75-1.75-1.75z"
            />
          </svg>
          <span>{post.user.displayName || post.user.username} reposted</span>
        </div>
      )}

      {/* POST CONTENT */}
      <div className={`flex gap-4 ${type === "status" && "flex-col"}`}>
        {/* AVATAR */}
        <div
          className={`${
            type === "status" && "hidden"
          } relative w-10 h-10 rounded-full overflow-hidden -z-10`}
        >
          <CustomImage
            src={originalPost.user.img || undefined}
            alt="User avatar"
            w={100}
            h={100}
            tr={true}
            isAvatar={true}
            gender={originalPost.user.gender}
          />
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col gap-2">
          {/* TOP */}
          <div className="w-full flex justify-between">
            <Link
              href={`/${originalPost.user.username}`}
              className="flex gap-4"
            >
              <div
                className={`${
                  type !== "status" && "hidden"
                } relative w-10 h-10 rounded-full overflow-hidden`}
              >
                <CustomImage
                  src={originalPost.user.img || undefined}
                  alt="User avatar"
                  w={100}
                  h={100}
                  tr={true}
                  isAvatar={true}
                  gender={originalPost.user.gender}
                />
              </div>
              <div
                className={`flex items-center gap-2 flex-wrap ${
                  type === "status" && "flex-col gap-0 !items-start"
                }`}
              >
                <h1 className="text-md font-bold">
                  {originalPost.user.displayName || originalPost.user.username}
                </h1>
                <span
                  className={`text-textGray ${type === "status" && "text-sm"}`}
                >
                  @{originalPost.user.username}
                </span>
                {type !== "status" && (
                  <span className="text-textGray">
                    {format(originalPost.createdAt)}
                  </span>
                )}
              </div>
            </Link>
            <PostInfo />
          </div>

          {/* TEXT & MEDIA */}
          <Link
            href={`/${originalPost.user.username}/status/${originalPost.id}`}
          >
            <p className={`${type === "status" && "text-lg"}`}>
              {originalPost.desc}
            </p>
          </Link>

          {/* სურათის ჩვენება */}
          {originalPost.img && (
            <div className="overflow-hidden rounded-lg">
              <CustomImage
                src={originalPost.img || undefined}
                alt=""
                w={600}
                h={originalPost.imgHeight || 600}
                className={originalPost.isSensitive ? "blur-3xl" : ""}
              />
            </div>
          )}

          {/* ვიდეოს ჩვენება */}
          {originalPost.video && (
            <div className="rounded-lg overflow-hidden">
              <Video
                path={originalPost.video}
                className={originalPost.isSensitive ? "blur-3xl" : ""}
              />
            </div>
          )}

          {/* დრო სტატუსის ტიპის პოსტებისთვის */}
          {type === "status" && (
            <span className="text-textGray">
              {format(originalPost.createdAt)}
            </span>
          )}
          
          {/* ფაქტების შემოწმების ღილაკი */}
          {originalPost.desc && originalPost.desc.length >= 15 && (
            <div className="mb-2">
              <FactCheckButton 
                postId={originalPost.id} 
                postContent={originalPost.desc} 
              />
            </div>
          )}
          
          {/* ინტერაქციის ღილაკები */}
          <PostInteractions
            username={originalPost.user.username}
            postId={originalPost.id}
            count={originalPost._count}
            isLiked={!!originalPost.likes.length}
            isRePosted={!!originalPost.rePosts.length}
            isSaved={!!originalPost.saves.length}
          />
        </div>
      </div>
    </div>
  );
};

export default Post;